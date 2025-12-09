import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { task_title, task_desc, urgency, assigned_by, assigned_to, attachments } = await req.json();

    let filesHtml = "";
    if (attachments && attachments.length > 0) {
      filesHtml = `
        <div style="margin-top: 15px; padding: 10px; background-color: #f3f4f6; border-radius: 8px;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #4b5563;">📎 Archivos adjuntos:</p>
            ${attachments.map((file: any) => 
                `<a href="${file.url}" style="display: block; margin-bottom: 5px; color: #0066ff; text-decoration: none;">📄 ${file.name}</a>`
            ).join('')}
        </div>`;
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Agenda Galher <onboarding@resend.dev>", // CAMBIA ESTO si ya verificaste tu dominio en Resend
        to: ["tu_correo@ejemplo.com"], // ⚠️ IMPORTANTE: Pon aquí tu correo para probar
        subject: `Nueva Tarea: ${task_title} (${urgency})`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 10px;">
            <h2 style="color: #1e293b;">Nueva Asignación</h2>
            <p><strong>De:</strong> ${assigned_by}</p>
            <p><strong>Para:</strong> ${assigned_to}</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <h3 style="color: #0066ff;">${task_title}</h3>
            <p style="color: #4b5563; line-height: 1.5;">${task_desc || "Sin descripción adicional."}</p>
            <div style="margin-top: 20px;">
              <span style="background: ${urgency === 'ALTA' ? '#ef4444' : urgency === 'MEDIA' ? '#f59e0b' : '#10b981'}; color: white; padding: 5px 10px; border-radius: 5px; font-weight: bold; font-size: 12px;">URGENCIA: ${urgency}</span>
            </div>
            ${filesHtml}
          </div>
        `,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});supabase/functions/resend-email/index.ts
