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

    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');

    const {
      data: { user: caller },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !caller) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    const { data: isAdmin, error: roleError } = await supabase.rpc('has_role', {
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
          supabase.from('profiles').select('id, created_at'),
          supabase.from('projects').select('id, budget, payment_status, created_at'),
          supabase.from('missions').select('id, created_at'),
          supabase.from('mission_applications').select('id, created_at'),
        ]);

        if (profiles.error) throw profiles.error;
        if (projects.error) throw projects.error;
        if (missions.error) throw missions.error;
        if (applications.error) throw applications.error;

        const projectRows = projects.data || [];
        const totalBudget = projectRows.reduce((sum, project) => sum + Number(project.budget || 0), 0);
        const paidBudget = projectRows
          .filter((project) => project.payment_status === 'paid')
          .reduce((sum, project) => sum + Number(project.budget || 0), 0);

        result = {
          totalUsers: profiles.data?.length || 0,
          totalProjects: projectRows.length,
          totalMissions: missions.data?.length || 0,
          totalApplications: applications.data?.length || 0,
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
        const { data: projectRows, error: projectsError } = await supabase
          .from('projects')
          .select('id, title, description, category, priority, budget, payment_status, status, user_id, created_at')
          .order('created_at', { ascending: false });

        if (projectsError) throw projectsError;

        const userIds = [...new Set((projectRows || []).map((project) => project.user_id).filter(Boolean))] as string[];
        const profilesByUserId = new Map<string, { email: string | null; full_name: string | null }>();

        if (userIds.length > 0) {
          const { data: profileRows, error: profilesError } = await supabase
            .from('profiles')
            .select('id, email, full_name')
            .in('id', userIds);

          if (profilesError) throw profilesError;

          (profileRows || []).forEach((profile) => {
            profilesByUserId.set(profile.id, { email: profile.email, full_name: profile.full_name });
          });
        }

        result = (projectRows || []).map((project) => ({
          ...project,
          profiles: project.user_id ? profilesByUserId.get(project.user_id) || null : null,
        }));
        break;
      }

      case 'get_missions': {
        const { data: missionRows, error: missionsError } = await supabase
          .from('missions')
          .select('id, title, description, skill, hours, hourly_rate, reward, status, project_id, approved_by, approved_at, created_at')
          .order('created_at', { ascending: false });

        if (missionsError) throw missionsError;

        const projectIds = [...new Set((missionRows || []).map((mission) => mission.project_id))];
        const projectsById = new Map<string, { title: string; user_id: string | null; payment_status: string }>();

        if (projectIds.length > 0) {
          const { data: projectRows, error: projectsError } = await supabase
            .from('projects')
            .select('id, title, user_id, payment_status')
            .in('id', projectIds);

          if (projectsError) throw projectsError;

          (projectRows || []).forEach((project) => {
            projectsById.set(project.id, {
              title: project.title,
              user_id: project.user_id,
              payment_status: project.payment_status,
            });
          });
        }

        result = (missionRows || []).map((mission) => ({
          ...mission,
          projects: projectsById.get(mission.project_id) || null,
        }));
        break;
      }

      case 'update_payment_status': {
        const { project_id, payment_status } = params;

        if (!project_id || !['paid', 'unpaid'].includes(payment_status)) {
          return jsonResponse({ error: 'Invalid project_id or payment_status' }, 400);
        }

        const { error } = await supabase.from('projects').update({ payment_status }).eq('id', project_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'approve_mission': {
        const { mission_id } = params;

        if (!mission_id) {
          return jsonResponse({ error: 'mission_id is required' }, 400);
        }

        const { data: mission, error: missionError } = await supabase
          .from('missions')
          .select('project_id')
          .eq('id', mission_id)
          .single();

        if (missionError || !mission) {
          return jsonResponse({ error: 'Mission not found' }, 404);
        }

        const { data: project, error: projectError } = await supabase
          .from('projects')
          .select('payment_status')
          .eq('id', mission.project_id)
          .single();

        if (projectError || !project) {
          return jsonResponse({ error: 'Project not found' }, 404);
        }

        if (project.payment_status !== 'paid') {
          return jsonResponse({ error: 'Project must be paid before approving missions' }, 400);
        }

        const { error } = await supabase
          .from('missions')
          .update({
            status: 'approved',
            approved_by: caller.id,
            approved_at: new Date().toISOString(),
          })
          .eq('id', mission_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'reject_mission': {
        const { mission_id } = params;

        if (!mission_id) {
          return jsonResponse({ error: 'mission_id is required' }, 400);
        }

        const { error } = await supabase
          .from('missions')
          .update({ status: 'rejected', approved_by: null, approved_at: null })
          .eq('id', mission_id);

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_pending_releases': {
        const { data: appRows, error: appError } = await supabase
          .from('mission_applications')
          .select('id, status, delivery_url, delivered_at, reviewed_at, review_note, mission_id, user_id')
          .eq('status', 'completed')
          .order('reviewed_at', { ascending: false });

        if (appError) throw appError;
        const apps = appRows || [];

        if (apps.length === 0) {
          result = [];
          break;
        }

        const missionIds = [...new Set(apps.map((a) => a.mission_id))];
        const userIds = [...new Set(apps.map((a) => a.user_id))];

        const [missionsRes, profilesRes] = await Promise.all([
          supabase.from('missions').select('id, title, reward, project_id').in('id', missionIds),
          supabase.from('profiles').select('id, email, full_name').in('id', userIds),
        ]);

        if (missionsRes.error) throw missionsRes.error;
        if (profilesRes.error) throw profilesRes.error;

        const missionMap = new Map((missionsRes.data || []).map((m) => [m.id, m]));
        const profileMap = new Map((profilesRes.data || []).map((p) => [p.id, p]));

        const projectIds = [...new Set((missionsRes.data || []).map((m) => m.project_id))];
        const { data: projectRows } = await supabase.from('projects').select('id, title').in('id', projectIds);
        const projectMap = new Map((projectRows || []).map((p) => [p.id, p.title]));

        result = apps.map((a) => {
          const mission = missionMap.get(a.mission_id);
          const profile = profileMap.get(a.user_id);
          return {
            ...a,
            missionTitle: mission?.title || 'Mission',
            missionReward: Number(mission?.reward || 0),
            projectTitle: mission ? (projectMap.get(mission.project_id) || 'Project') : 'Project',
            explorerEmail: profile?.email || '',
            explorerName: profile?.full_name || '',
          };
        });
        break;
      }

      case 'release_funds': {
        const { application_id } = params;
        if (!application_id) {
          return jsonResponse({ error: 'application_id is required' }, 400);
        }

        const { error } = await supabase
          .from('mission_applications')
          .update({ status: 'funds_released' })
          .eq('id', application_id)
          .eq('status', 'completed');

        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'suspend_user': {
        const { user_id } = params;

        if (!user_id) {
          return jsonResponse({ error: 'user_id is required' }, 400);
        }

        const { error } = await supabase.auth.admin.updateUserById(user_id, { ban_duration: '876000h' });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'activate_user': {
        const { user_id } = params;

        if (!user_id) {
          return jsonResponse({ error: 'user_id is required' }, 400);
        }

        const { error } = await supabase.auth.admin.updateUserById(user_id, { ban_duration: 'none' });
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'get_withdrawals': {
        const { data: wRows, error: wError } = await supabase
          .from('withdrawal_requests')
          .select('*')
          .order('created_at', { ascending: false });

        if (wError) throw wError;
        const wApps = wRows || [];

        if (wApps.length === 0) { result = []; break; }

        const wUserIds = [...new Set(wApps.map(w => w.user_id))];
        const { data: wProfiles } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .in('id', wUserIds);

        const wProfileMap = new Map((wProfiles || []).map(p => [p.id, p]));

        result = wApps.map(w => ({
          ...w,
          explorerEmail: wProfileMap.get(w.user_id)?.email || '',
          explorerName: wProfileMap.get(w.user_id)?.full_name || '',
        }));
        break;
      }

      case 'process_withdrawal': {
        const { withdrawal_id, new_status, admin_note } = params;
        if (!withdrawal_id || !['approved', 'rejected'].includes(new_status)) {
          return jsonResponse({ error: 'Invalid withdrawal_id or status' }, 400);
        }

        const { error } = await supabase
          .from('withdrawal_requests')
          .update({
            status: new_status,
            admin_note: admin_note || null,
            processed_at: new Date().toISOString(),
            processed_by: caller.id,
          })
          .eq('id', withdrawal_id)
          .eq('status', 'pending');

        if (error) throw error;
        result = { success: true };
        break;
      }

      default:
        return jsonResponse({ error: 'Unknown action' }, 400);
    }

    return jsonResponse(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return jsonResponse({ error: message }, 500);
  }
});
