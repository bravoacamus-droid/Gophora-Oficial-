import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get('authorization') || req.headers.get('Authorization');
    let token = '';

    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.replace('Bearer ', '');
    } else if (authHeader) {
      token = authHeader;
    }

    if (!token) {
      console.error('Auth error: Missing token');
      return jsonResponse({ error: 'Unauthorized: Missing token' }, 401);
    }

    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      console.error('Auth error from getUser:', authError?.message || 'No user found');
      return jsonResponse({ error: `Unauthorized: ${authError?.message || 'Invalid user'}` }, 401);
    }

    // Security check: Use verify_user_role RPC
    const { data: isAdmin, error: roleError } = await supabase.rpc('verify_user_role', {
      _user_id: caller.id,
      _role: 'admin',
    });

    if (roleError || !isAdmin) {
      return jsonResponse({ error: 'Forbidden: Admin role required' }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const { action, ...params } = body;

    if (!action || typeof action !== 'string') {
      return jsonResponse({ error: 'Action is required' }, 400);
    }

    let result: unknown;

    switch (action) {
      case 'get_stats': {
        const [profiles, projects, missions, deliverables] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('projects').select('budget, payment_status'),
          supabase.from('missions').select('id', { count: 'exact', head: true }),
          supabase.from('deliverables').select('id', { count: 'exact', head: true }),
        ]);

        const projectRows = projects.data || [];
        const totalBudget = projectRows.reduce((sum, p) => sum + Number(p.budget || 0), 0);
        const paidBudget = projectRows
          .filter((p) => p.payment_status === 'paid')
          .reduce((sum, p) => sum + Number(p.budget || 0), 0);

        result = {
          totalUsers: profiles.count || 0,
          totalProjects: projectRows.length,
          totalMissions: missions.count || 0,
          totalApplications: deliverables.count || 0,
          totalBudget,
          paidBudget,
          commission: Math.round(paidBudget * 0.1),
        };
        break;
      }

      case 'get_users': {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, full_name, account_type, created_at')
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = data || [];
        break;
      }

      case 'get_projects': {
        const { data, error } = await supabase
          .from('projects')
          .select(`
            id, title, description, category, priority, budget, 
            payment_status, status, created_at, user_id,
            profiles:user_id (id, email, full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = data || [];
        break;
      }

      case 'get_missions': {
        const { data, error } = await supabase
          .from('missions')
          .select(`
            id, title, description, skill, hours, hourly_rate, reward, 
            status, project_id, approved_by, approved_at, created_at,
            projects (id, title, user_id, payment_status, payment_screenshot_url, tx_hash)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = data || [];
        break;
      }

      case 'update_payment_status': {
        const { project_id, payment_status } = params;
        if (!project_id || !payment_status) throw new Error('Missing parameters');
        const { error } = await supabase.from('projects').update({ payment_status }).eq('id', project_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'approve_mission': {
        const { mission_id } = params;
        const { error } = await supabase.from('missions').update({
          status: 'approved',
          approved_by: caller.id,
          approved_at: new Date().toISOString()
        }).eq('id', mission_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'reject_mission': {
        const { mission_id } = params;
        const { error } = await supabase.from('missions').update({
          status: 'rejected',
          approved_by: null,
          approved_at: null
        }).eq('id', mission_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_pending_releases': {
        const { data, error } = await supabase
          .from('deliverables')
          .select(`
            id, status, delivery_url, submitted_at, reviewed_at, review_note,
            missionTitle:missions(title),
            missionReward:missions(reward),
            projectTitle:missions(projects(title)),
            explorerEmail:profiles(email),
            explorerName:profiles(full_name)
          `)
          .in('status', ['submitted', 'delivered', 'pending'])
          .order('submitted_at', { ascending: false });

        if (error) throw error;
        result = data || [];
        break;
      }

      case 'release_funds': {
        const { application_id } = params;
        // Update deliverable
        const { data: appData, error: updateErr } = await supabase
          .from('deliverables')
          .update({
            status: 'funds_released',
            reviewed_at: new Date().toISOString(),
            reviewed_by: caller.id
          })
          .eq('id', application_id)
          .select('mission_id')
          .single();

        if (updateErr) throw updateErr;

        // Mark mission as completed
        if (appData?.mission_id) {
          await supabase.from('missions').update({ status: 'completed' }).eq('id', appData.mission_id);
        }
        result = { success: true };
        break;
      }

      case 'get_withdrawals': {
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select(`
            *,
            explorerEmail:profiles!withdrawal_requests_user_id_fkey(email),
            explorerName:profiles!withdrawal_requests_user_id_fkey(full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = (data || []).map((w: any) => ({
          ...w,
          explorerEmail: w.explorerEmail?.email || '',
          explorerName: w.explorerName?.full_name || ''
        }));
        break;
      }

      case 'process_withdrawal': {
        const { withdrawal_id, new_status, admin_note } = params;
        const { error } = await supabase.from('withdrawal_requests').update({
          status: new_status,
          admin_note: admin_note || null,
          processed_at: new Date().toISOString(),
          processed_by: caller.id
        }).eq('id', withdrawal_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_academy_courses': {
        const { data, error } = await supabase
          .from('academy_courses')
          .select(`*, path_title:academy_paths(title)`)
          .order('sort_order');
        if (error) throw error;
        result = (data || []).map((c: any) => ({
          ...c,
          path_title: c.path_title?.title || 'Sin Ruta'
        }));
        break;
      }

      case 'get_academy_paths': {
        const { data, error } = await supabase.from('academy_paths').select('id, title').order('sort_order');
        if (error) throw error;
        result = data || [];
        break;
      }

      case 'create_course': {
        const { error } = await supabase.from('academy_courses').insert({
          ...params,
          course_status: 'published'
        });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'delete_course': {
        const { course_id } = params;
        const { error } = await supabase.from('academy_courses').delete().eq('id', course_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_tutor_applications': {
        const { data, error } = await supabase
          .from('tutor_applications')
          .select('*, profiles:user_id(email, full_name)')
          .order('created_at', { ascending: false });
        if (error) throw error;
        result = (data || []).map((a: any) => ({
          ...a,
          email: a.profiles?.email,
          full_name: a.profiles?.full_name
        }));
        break;
      }

      case 'review_tutor': {
        const { application_id, status, admin_note } = params;
        const { data: app, error: fetchErr } = await supabase.from('tutor_applications').select('user_id').eq('id', application_id).single();
        if (fetchErr) throw fetchErr;

        const { error } = await supabase.from('tutor_applications').update({
          status, reviewed_at: new Date().toISOString(), reviewed_by: caller.id, admin_note: admin_note || null
        }).eq('id', application_id);
        if (error) throw error;

        if (status === 'approved' && app) {
          await supabase.from('user_roles').upsert({ user_id: app.user_id, role: 'tutor' }, { onConflict: 'user_id,role' });
        }
        result = { success: true };
        break;
      }

      case 'get_payment_history': {
        const { data, error } = await supabase
          .from('deliverables')
          .select(`
            id, status, delivery_url, submitted_at, reviewed_at, review_note,
            missionTitle:missions(title),
            missionReward:missions(reward),
            projectTitle:missions(projects(title)),
            explorerEmail:profiles(email),
            explorerName:profiles(full_name)
          `)
          .in('status', ['completed', 'funds_released'])
          .order('reviewed_at', { ascending: false });
        if (error) throw error;
        result = data || [];
        break;
      }

      case 'suspend_user': {
        const { user_id } = params;
        const { error } = await supabase.auth.admin.updateUserById(user_id, { ban_duration: '876000h' });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'activate_user': {
        const { user_id } = params;
        const { error } = await supabase.auth.admin.updateUserById(user_id, { ban_duration: 'none' });
        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return jsonResponse({ error: `Action '${action}' not implemented` }, 400);
    }

    return jsonResponse(result);
  } catch (err) {
    console.error('Edge Function Error:', err);
    return jsonResponse({ error: err instanceof Error ? err.message : 'Internal server error' }, 500);
  }
});
