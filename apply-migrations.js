const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas')
  console.log('Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applyMigrations() {
  console.log('🔄 Aplicando migrations...')
  
  try {
    // Ler e aplicar migration de separação granular
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20240101000004_separacao_granular.sql')
    const fixMigrationPath = path.join(__dirname, 'supabase', 'migrations', '20240101000005_fix_separacao_data.sql')
    
    if (fs.existsSync(migrationPath)) {
      console.log('📄 Aplicando migration de separação granular...')
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
      
      const { error: migrationError } = await supabase.rpc('exec_sql', {
        sql: migrationSQL
      })
      
      if (migrationError) {
        console.warn('⚠️  Aviso na migration principal:', migrationError.message)
      } else {
        console.log('✅ Migration principal aplicada com sucesso')
      }
    }
    
    if (fs.existsSync(fixMigrationPath)) {
      console.log('🔧 Aplicando correções de dados...')
      const fixSQL = fs.readFileSync(fixMigrationPath, 'utf8')
      
      const { error: fixError } = await supabase.rpc('exec_sql', {
        sql: fixSQL
      })
      
      if (fixError) {
        console.warn('⚠️  Aviso na correção:', fixError.message)
      } else {
        console.log('✅ Correções aplicadas com sucesso')
      }
    }
    
    // Verificar se as views foram criadas
    console.log('🔍 Verificando views...')
    
    const { data: viewData, error: viewError } = await supabase
      .from('vw_separacao_dashboard')
      .select('*')
      .limit(1)
    
    if (viewError) {
      console.error('❌ Erro ao verificar view:', viewError.message)
    } else {
      console.log('✅ View vw_separacao_dashboard funcionando')
    }
    
    // Testar busca de solicitações
    console.log('🔍 Testando busca de solicitações...')
    
    const { data: solicitacoes, error: solicitacoesError } = await supabase
      .from('solicitacoes')
      .select('*')
      .eq('status', 'pendente')
    
    if (solicitacoesError) {
      console.error('❌ Erro ao buscar solicitações:', solicitacoesError.message)
    } else {
      console.log(`✅ Encontradas ${solicitacoes.length} solicitações pendentes`)
    }
    
    console.log('🎉 Migrations aplicadas com sucesso!')
    
  } catch (error) {
    console.error('❌ Erro ao aplicar migrations:', error)
    process.exit(1)
  }
}

applyMigrations()