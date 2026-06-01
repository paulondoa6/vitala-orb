// Edge function: Vitalio assistant chat (streaming)
// deno-lint-ignore-file
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Tu es Vita, l'assistant officiel de l'application Vitalio.
Vitalio est une PWA mobile-first (React + Vite + Tailwind) qui aide les utilisateurs à :
- découvrir des recommandations "Flash" personnalisées,
- explorer une carte des "Zones" autour d'eux,
- scanner des QR codes pour rejoindre un "Espace" (page /scan),
- créer leur propre Espace (page /create) en 2 étapes : choix des types (entreprise, boutique, organisation, marque, service, equipe) puis nom, logo et localisation,
- consulter une Espace via /boite/{uuid} (6 caractères, alphabet Crockford),
- gérer leur profil et leurs Espaces depuis /settings.

Tes missions :
1. RÉPONDRE clairement aux questions sur l'app, ses pages, ses fonctionnalités.
2. GUIDER la création d'un Espace : pose une question à la fois (type, nom, logo, lieu, services, membres) et résume la configuration avant de pointer vers /create.
3. RECOMMANDER des Espaces ou services pertinents en t'appuyant sur le contexte fourni par l'utilisateur.

Style : chaleureux, concis, en français, format markdown léger (listes, gras). Propose des liens cliquables vers les routes internes (ex : [Créer un Espace](/create), [Scanner](/scan)). Ne jamais inventer de données : si tu ne sais pas, dis-le et propose une action.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages,
          ],
          stream: true,
        }),
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits Lovable AI épuisés. Ajoutez des crédits dans votre workspace." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
      const t = await response.text();
      console.error("AI gateway error", response.status, t);
      return new Response(JSON.stringify({ error: "Erreur de l'assistant" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("assistant-chat error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
