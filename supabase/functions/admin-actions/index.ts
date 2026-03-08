import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get the requesting user from auth header
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user: caller }, error: authError } = await supabase.auth.getUser(authHeader);
    if (authError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if caller is admin
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: caller.id, _role: 'admin' });
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden: Admin role required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();

    let result;

    switch (action) {
      case 'get_stats': {
        const [profiles, projects, missions, applications] = await Promise.all([
          supabase.from('profiles').select('*'),
          supabase.from('projects').select('*'),
          supabase.from('missions').select('*'),
          supabase.from('mission_applications').select('*'),
        ]);
        
        const totalBudget = (projects.data || []).reduce((sum: number, p: any) => sum + Number(p.budget), 0);
        const paidBudget = (projects.data || []).filter((p: any) => p.payment_status === 'paid').reduce((sum: number, p: any) => sum + Number(p.budget), 0);
        
        result = {
          totalUsers: profiles.data?.length || 0,
          totalProjects: projects.data?.length || 0,
          totalMissions: missions.data?.length || 0,
          totalApplications: applications.data?.length || 0,
          totalBudget,
          paidBudget,
          commission: Math.round(paidBudget * 0.10),
        };
        break;
      }

      case 'get_users': {
        const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        result = data || [];
        break;
      }

      case 'get_projects': {
        const { data } = await supabase.from('projects').select('*, profiles!projects_user_id_fkey(email, full_name)').order('created_at', { ascending: false });
        result = data || [];
        break;
      }

      case 'get_missions': {
        const { data } = await supabase.from('missions').select('*, projects(title, user_id, payment_status)').order('created_at', { ascending: false });
        result = data || [];
        break;
      }

      case 'update_payment_status': {
        const { project_id, payment_status } = params;
        const { error } = await supabase.from('projects').update({ payment_status }).eq('id', project_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'approve_mission': {
        const { mission_id } = params;
        // Check if the project is paid
        const { data: mission } = await supabase.from('missions').select('project_id, projects(payment_status)').eq('id', mission_id).single();
        if (!mission || (mission as any).projects?.payment_status !== 'paid') {
          return new Response(JSON.stringify({ error: 'Project must be paid before approving missions' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const { error } = await supabase.from('missions').update({
          status: 'approved',
          approved_by: caller.id,
          approved_at: new Date().toISOString(),
        }).eq('id', mission_id);
        if (error) throw error;
        result = { success: true };
        break;
      }

      case 'reject_mission': {
        const { mission_id } = params;
        const { error } = await supabase.from('missions').update({ status: 'rejected' }).eq('id', mission_id);
        if (error) throw error;
        result = { success: true };
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
        return new Response(JSON.stringify({ error: 'Unknown action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
