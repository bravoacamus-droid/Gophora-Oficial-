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
        const [profiles, projects, missions, applications] = await Promise.all([
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
          supabase.from('projects').select('budget, payment_status'),
          supabase.from('missions').select('id', { count: 'exact', head: true }),
          supabase.from('mission_applications').select('id', { count: 'exact', head: true }),
        ]);

        const projectRows = projects.data || [];
        const totalBudget = projectRows.reduce((sum: number, p: any) => sum + Number(p.budget || 0), 0);
        const paidBudget = projectRows
          .filter((p: any) => p.payment_status === 'paid')
          .reduce((sum: number, p: any) => sum + Number(p.budget || 0), 0);

        result = {
          totalUsers: profiles.count || 0,
          totalProjects: projectRows.length,
          totalMissions: missions.count || 0,
          totalApplications: applications.count || 0,
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
            profiles (id, email, full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        // The frontend expects `profiles.email` etc., map if necessary:
        result = (data || []).map((p: any) => ({
          ...p,
          profiles: Array.isArray(p.profiles) ? p.profiles[0] : p.profiles
        }));
        break;
      }

      case 'get_missions': {
        const { data, error } = await supabase
          .from('missions')
          .select(`
            id, title, description, skill, hours, hourly_rate, reward, 
            status, project_id, created_at,
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
          status: 'approved'
        }).eq('id', mission_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'reject_mission': {
        const { mission_id } = params;
        const { error } = await supabase.from('missions').update({
          status: 'rejected'
        }).eq('id', mission_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_pending_releases': {
        const { data, error } = await supabase
          .from('mission_assignments')
          .select(`
            id, status, delivery_url, delivered_at, reviewed_at, review_note,
            mission:mission_id (
              title,
              reward,
              project:project_id (title)
            ),
            profile:explorer_profiles (
              profiles (email, full_name)
            )
          `)
          .in('status', ['submitted', 'approved'])
          .order('delivered_at', { ascending: false });

        if (error) throw error;

        // Map to flat structure for frontend compatibility
        result = (data || []).map((app: any) => ({
          id: app.id,
          status: app.status,
          delivery_url: app.delivery_url,
          submitted_at: app.delivered_at,
          reviewed_at: app.reviewed_at,
          review_note: app.review_note,
          missionTitle: app.mission?.title,
          missionReward: app.mission?.reward,
          projectTitle: app.mission?.project?.title,
          explorerEmail: app.profile?.profiles?.email,
          explorerName: app.profile?.profiles?.full_name
        }));
        break;
      }

      case 'release_funds': {
        const { application_id } = params;
        // Update application
        const { data: appData, error: updateErr } = await supabase
          .from('mission_assignments')
          .update({
            status: 'funds_released',
            funds_released_at: new Date().toISOString(),
            funds_released_by: caller.id
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
            profiles(email, full_name)
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        result = (data || []).map((w: any) => ({
          ...w,
          explorerEmail: w.profiles?.email || '',
          explorerName: w.profiles?.full_name || ''
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

      case 'update_course_status': {
        const { course_id, status } = params;
        if (!course_id || !status) throw new Error('Missing course_id or status');
        if (!['published', 'pending_review', 'rejected', 'archived'].includes(status)) {
          throw new Error(`Invalid course status: ${status}`);
        }
        const { error } = await supabase
          .from('academy_courses')
          .update({ course_status: status })
          .eq('id', course_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_tutor_applications': {
        const { data, error } = await supabase
          .from('tutor_applications')
          .select('*, profiles(email, full_name)')
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
          .from('mission_assignments')
          .select(`
            id, status, delivery_url, delivered_at, reviewed_at, review_note,
            mission:mission_id (
              title,
              reward,
              project:project_id (title)
            ),
            profile:explorer_profiles (
              profiles (email, full_name)
            )
          `)
          .in('status', ['completed', 'funds_released'])
          .order('reviewed_at', { ascending: false });

        if (error) throw error;

        // Map to flat structure for frontend compatibility
        result = (data || []).map((app: any) => ({
          id: app.id,
          status: app.status,
          delivery_url: app.delivery_url,
          submitted_at: app.delivered_at,
          reviewed_at: app.reviewed_at,
          review_note: app.review_note,
          missionTitle: app.mission?.title,
          missionReward: app.mission?.reward,
          projectTitle: app.mission?.project?.title,
          explorerEmail: app.profile?.profiles?.email,
          explorerName: app.profile?.profiles?.full_name
        }));
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

      case 'get_commission_detail': {
        // Detail behind the "Comisión GOPHORA" card on Revenue tab.
        // Returns one row per project with its budget, paid amount,
        // 10% commission slice, plus the top-3 explorers by reward earned.
        const [paidProjects, topAssignments] = await Promise.all([
          supabase
            .from('projects')
            .select(`id, title, budget, payment_status, status, created_at,
              profiles (email, full_name),
              missions (
                id, status, reward,
                mission_assignments (
                  status, reward:reward,
                  profile:explorer_profiles (
                    profiles (email, full_name)
                  )
                )
              )
            `)
            .eq('payment_status', 'paid')
            .order('created_at', { ascending: false }),
          supabase
            .from('mission_assignments')
            .select(`
              status,
              mission:mission_id (reward),
              profile:explorer_profiles (
                profiles (email, full_name)
              )
            `)
            .in('status', ['completed', 'funds_released']),
        ]);
        if (paidProjects.error) throw paidProjects.error;
        if (topAssignments.error) throw topAssignments.error;

        const projectRows = (paidProjects.data || []).map((p: any) => {
          const budget = Number(p.budget || 0);
          const completedMissions = (p.missions || []).filter((m: any) =>
            ['approved', 'completed', 'funds_released'].includes(m.status)
          );
          const paidOut = completedMissions.reduce((s: number, m: any) => s + Number(m.reward || 0), 0);
          const explorerSet = new Set<string>();
          completedMissions.forEach((m: any) => {
            (m.mission_assignments || []).forEach((a: any) => {
              const email = a.profile?.profiles?.email;
              if (email) explorerSet.add(email);
            });
          });
          return {
            id: p.id,
            title: p.title,
            companyEmail: p.profiles?.email || null,
            companyName: p.profiles?.full_name || null,
            createdAt: p.created_at,
            status: p.status,
            budget,
            paidOut,
            commission: Math.round(paidOut * 0.1 * 100) / 100,
            explorerCount: explorerSet.size,
          };
        });

        // Top explorers by total reward
        const explorerTotals = new Map<string, { email: string; name: string | null; total: number; missions: number }>();
        (topAssignments.data || []).forEach((a: any) => {
          const email = a.profile?.profiles?.email;
          if (!email) return;
          const reward = Number(a.mission?.reward || 0);
          const cur = explorerTotals.get(email) || { email, name: a.profile?.profiles?.full_name || null, total: 0, missions: 0 };
          cur.total += reward;
          cur.missions += 1;
          explorerTotals.set(email, cur);
        });
        const topExplorers = [...explorerTotals.values()]
          .sort((a, b) => b.total - a.total)
          .slice(0, 5);

        const totalPaidOut = projectRows.reduce((s: number, p: any) => s + p.paidOut, 0);
        const totalCommission = projectRows.reduce((s: number, p: any) => s + p.commission, 0);

        result = {
          projects: projectRows,
          topExplorers,
          totals: {
            projectCount: projectRows.length,
            paidOut: totalPaidOut,
            commission: totalCommission,
            beneficiaries: explorerTotals.size,
          },
        };
        break;
      }

      case 'get_investor_offers_log': {
        // Read-only chronological feed of investor offers. Built as a
        // sequence of small queries because investor_user_id FKs to
        // auth.users (not profiles) so PostgREST can't auto-embed it.
        const offersRes = await supabase
          .from('investor_offers')
          .select('id, project_id, investor_user_id, amount_usd, equity_percent, message, status, signed_pdf_url, created_at, reviewed_at')
          .order('created_at', { ascending: false })
          .limit(200);
        if (offersRes.error) throw offersRes.error;
        const offerRows: any[] = offersRes.data || [];

        const projectIds = Array.from(new Set(offerRows.map((o: any) => o.project_id))).filter(Boolean);
        const investorIds = Array.from(new Set(offerRows.map((o: any) => o.investor_user_id))).filter(Boolean);

        let projectRows: any[] = [];
        if (projectIds.length > 0) {
          const r = await supabase
            .from('projects')
            .select('id, title, industry, funding_percent_sought, cost_estimate, user_id')
            .in('id', projectIds);
          if (r.error) throw r.error;
          projectRows = r.data || [];
        }

        const ownerIds = Array.from(new Set(projectRows.map((p: any) => p.user_id))).filter(Boolean);
        const allProfileIds = Array.from(new Set([...investorIds, ...ownerIds]));

        let profileRows: any[] = [];
        if (allProfileIds.length > 0) {
          const r = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', allProfileIds);
          if (r.error) throw r.error;
          profileRows = r.data || [];
        }

        const projectMap = new Map<string, any>();
        for (const p of projectRows) projectMap.set(p.id, p);
        const profileMap = new Map<string, any>();
        for (const p of profileRows) profileMap.set(p.id, p);

        result = offerRows.map((o: any) => {
          const project = projectMap.get(o.project_id);
          const investor = profileMap.get(o.investor_user_id);
          const owner = project ? profileMap.get(project.user_id) : null;
          return {
            id: o.id,
            project_id: o.project_id,
            amount_usd: Number(o.amount_usd),
            equity_percent: Number(o.equity_percent),
            message: o.message,
            status: o.status,
            signed_pdf_url: o.signed_pdf_url,
            created_at: o.created_at,
            reviewed_at: o.reviewed_at,
            project_title: project?.title || 'Project',
            project_industry: project?.industry || null,
            project_cost_estimate: project?.cost_estimate ?? null,
            project_funding_percent: project?.funding_percent_sought ?? null,
            owner_email: owner?.email || null,
            owner_name: owner?.full_name || null,
            investor_email: investor?.email || null,
            investor_name: investor?.full_name || null,
          };
        });
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
