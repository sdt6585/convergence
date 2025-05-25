import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import characterCreation from './character-creation.ts';
Deno.serve(async (req)=>{
  //Enable CORS
  const headers = new Headers({
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info, Apikey, Authorization'
  });

  try {
    //TODO - setup auth checks
    // const authHeader = req.headers.get('Authorization');
    // if (!authHeader) {
    //   return new Response('Unauthorized', {
    //     status: 401,
    //     headers
    //   });
    // }
    // const token = authHeader.split(' ')[1];
    // // Verify the token (you can use a library like jsonwebtoken for this)
    // const { data, error } = await supabase.auth.api.getUser(token);
    // if (error || !data) {
    //   return new Response('Unauthorized', {
    //     status: 401,
    //     headers
    //   });
    // }

    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers
      });
    } else {
      headers.set('Content-Type', 'application/json');
    }

    /**
       *  Get the request body - this will be:
       *  - A specific named message type like
       *    -  { type: "character-creation", query: "Create a character" }
       *    -  { type: "name-generation", query: "Query: ....., character: {selected data}" }
       * 
       *  - A function with a tools array to filter the available functions
       *    -  { type: "function", messages: [past messages..., {role: "user", content: "Query: "....."}], tools: [ 'character_check', 'character_update' ] }
       * 
       *  - Or a chat which will just send messages, no structured response/tools
       *    -  { type: "chat", messages: [past messages..., {role: "user", content: "Query: "....."}] }
       **/ 
    const request = await req.json();

    if (Deno.env.get("AI_PROVIDER") === "GROQ") {
      // TODO: Implement GROQ AI_PROVIDER
      return new Response(
        JSON.stringify({
          type: "error",
          message: "GROQ AI_PROVIDER not implemented"
        }), 
        {
          status: 500,
          headers
        }
      );
    } else if (Deno.env.get("AI_PROVIDER") === "OPENAI") {
      // Determine the type of request and route it to the appropriate function
      // Documentation here: https://github.com/openai/openai-node
      // Choose model from here: https://platform.openai.com/docs/models
      const apiKey = Deno.env.get('OPENAI_API_KEY');
      const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4.1';
      const openai = new OpenAI({
        apiKey: apiKey
      });

      if (request.type === 'character-creation') {
        return new Response(JSON.stringify({
          type: "character-creation",
          character: await characterCreation({
            query: request.query, 
            openai,
            model,
            apiKey
          })
        }), {
          headers
        });
      } else if (request.type === 'name-generation') {
        
      }
      
      //   // Default: chat mode
      //   const chatCompletion = await openai.chat.completions.create({
      //     messages: [
      //       {
      //         role: 'user',
      //         content: query
      //       }
      //     ],
      //     model: model,
      //     stream: false
      //   });
      //   const reply = chatCompletion.choices[0].message.content;
      //   return new Response(JSON.stringify({
      //     type: "chat",
      //     reply
      //   }), {
      //     headers
      //   });
    } else {
      return new Response(JSON.stringify({
        type: "error",
        message: "AI_PROVIDER not set"
      }), {
        status: 500,
        headers
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      type: "error",
      message: "Error: " + error + " - " + error.stack
    }), {
      status: 500,
      headers
    });
  }
});