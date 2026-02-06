import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if admin already exists
    const { data: existingProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("email", "admin@transalvador.gov.br")
      .single();

    if (existingProfiles) {
      return new Response(
        JSON.stringify({ message: "Usuário master já existe", exists: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // Create admin user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: "admin@transalvador.gov.br",
      password: "123456",
      email_confirm: true,
      user_metadata: { nome: "Administrador Master" },
    });

    if (authError) throw authError;

    // The trigger should create the profile, but let's ensure the role is set
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: authData.user.id,
      role: "admin",
    });

    if (roleError) throw roleError;

    // Update profile to not require password change for master
    await supabaseAdmin
      .from("profiles")
      .update({ deve_trocar_senha: false })
      .eq("user_id", authData.user.id);

    // Log the creation
    await supabaseAdmin.from("logs_atividade").insert({
      tipo_acao: "ADMIN_CRIADO",
      usuario: "sistema",
      detalhes: "Usuário master inicial criado automaticamente",
    });

    return new Response(
      JSON.stringify({ 
        message: "Usuário master criado com sucesso",
        email: "admin@transalvador.gov.br",
        created: true
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 201 }
    );
  } catch (error) {
    console.error("Error creating admin:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
