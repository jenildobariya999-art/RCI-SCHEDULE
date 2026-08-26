export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({error:"GET only"});

  const apiKey=process.env.TBC_API_KEY;
  if(!apiKey) return res.status(500).json({error:"TBC_API_KEY is not configured"});

  const botId=String(req.query.bot_id||req.query.botid||"").trim();
  if(!/^\d+$/.test(botId))
    return res.status(400).json({error:"Invalid bot_id"});

  // Optional dashboard lock. Put comma-separated Telegram admin IDs in Vercel:
  // DASHBOARD_ADMINS=123456,987654
  const allowed=(process.env.DASHBOARD_ADMINS||"")
    .split(",").map(x=>x.trim()).filter(Boolean);

  // If admins are configured, require Telegram WebApp initData.
  if(allowed.length){
    const initData=String(req.query.initData||"");
    if(!initData)
      return res.status(403).json({error:"Open this page inside Telegram"});

    // This endpoint intentionally does not implement Telegram signature
    // validation here. Keep DASHBOARD_ADMINS empty unless you add validation
    // or use a trusted launch mechanism.
    // The TBC API key remains server-side either way.
  }

  try{
    const base="https://api.telebotcreator.com";
    const url=base+"/v2/bots/"+encodeURIComponent(botId)+
      "/export-bot?format=json&include_data=true";

    const r=await fetch(url,{
      method:"GET",
      headers:{
        "Authorization":"Bearer "+apiKey,
        "Accept":"application/json"
      }
    });

    const text=await r.text();
    let body;
    try{body=JSON.parse(text)}catch{body={raw:text}}

    if(!r.ok)
      return res.status(r.status).json({
        error:"TBC API request failed",
        details:body
      });

    // The endpoint is documented as a file download, so return whatever
    // JSON structure TBC actually returns.
    return res.status(200).json({
      bot_id:botId,
      export_data:body
    });
  }catch(e){
    return res.status(500).json({error:"Server error",details:String(e)});
  }
}
