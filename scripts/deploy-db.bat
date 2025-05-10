@echo off
REM simple-deploy.bat

echo Setting up environment...
FOR /F "tokens=*" %%A IN ('type .env.development') DO (
  SET %%A
)

echo Running login command...
call npx supabase login

echo Pushing database changes...
call npx supabase link --project-ref %SUPABASE_PROJECT_ID% --password %SUPABASE_DB_PASSWORD% && npx supabase db push

echo Batch file completed!