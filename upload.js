export const config = {
  runtime: 'edge',
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { 
      status: 405,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const UPLOADTHING_SECRET = process.env.UPLOADTHING_SECRET;
  
  if (!UPLOADTHING_SECRET) {
    return new Response(JSON.stringify({ error: "الخادم غير مهيأ. يجب إضافة UPLOADTHING_SECRET في Vercel Environment Variables." }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    // 1. استلام الملفات من الواجهة الأمامية (Frontend)
    const formData = await req.formData();
    
    // 2. إرسالها مباشرة إلى خوادم UploadThing مع المفتاح السري
    const response = await fetch("https://uploadthing.com/api/uploadFiles", {
      method: "POST",
      headers: {
        "x-uploadthing-api-key": UPLOADTHING_SECRET
      },
      body: formData
    });

    const data = await response.json();
    
    // 3. إعادة النتيجة (روابط الصور) للواجهة الأمامية
    return new Response(JSON.stringify(data), {
      status: response.status,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
