import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import OpenAI from "https://deno.land/x/openai@v4.69.0/mod.ts";
import characterCreation, { characterCreationStream } from './character-creation.ts';
Deno.serve(async (req)=>{
  //Enable CORS
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-Client-Info, Apikey, Authorization'
  };

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
        headers: corsHeaders
      });
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
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
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
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      } else if (request.type === 'character-creation-stream') {
        // Implement Server-Sent Events for real streaming
        const stream = new ReadableStream({
          async start(controller) {
            const encoder = new TextEncoder();
            
            try {
              const character = await characterCreationStream({
                query: request.query,
                openai,
                model,
                apiKey,
                onProgress: (data) => {
                  // Send each progress update as SSE
                  const sseData = `data: ${JSON.stringify(data)}\n\n`;
                  controller.enqueue(encoder.encode(sseData));
                }
              });
              
              // Send the final character data
              const finalData = `data: ${JSON.stringify({
                type: "final_character",
                character: character
              })}\n\n`;
              controller.enqueue(encoder.encode(finalData));
              
              // Send completion signal
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({type: "stream_complete"})}\n\n`));
              controller.close();
              
            } catch (error) {
              // Send error and close
              const errorData = `data: ${JSON.stringify({
                type: "error", 
                message: error.message || "Character generation failed"
              })}\n\n`;
              controller.enqueue(encoder.encode(errorData));
              controller.close();
            }
          }
        });
        
        return new Response(stream, {
          headers: {
            ...corsHeaders,
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          }
        });
      } else if (request.type === 'character-creation-batch') {
        // Keep the old batch method for fallback
        let progressData = [];
        
        const character = await characterCreationStream({
          query: request.query,
          openai,
          model,
          apiKey,
          onProgress: (data) => {
            progressData.push(data);
          }
        });
        
        return new Response(JSON.stringify({
          type: "character-creation-stream",
          character: character,
          progress: progressData
        }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
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
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({
      type: "error",
      message: "Error: " + error + " - " + error.stack
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});