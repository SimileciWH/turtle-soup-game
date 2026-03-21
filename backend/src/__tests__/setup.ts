// globalSetup：为测试环境注入必要的环境变量
export default async function setup(): Promise<void> {
  process.env['DATABASE_URL'] = 'postgresql://dev:devpass@localhost:5432/haiguitang_test'
  process.env['JWT_SECRET'] = 'test-secret-64-chars-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
  process.env['OPENAI_BASE_URL'] = 'https://api.minimaxi.chat/v1'
  process.env['OPENAI_API_KEY'] = 'test-key'
  process.env['SMTP_HOST'] = 'smtp.gmail.com'
  process.env['SMTP_PORT'] = '587'
  process.env['SMTP_USER'] = 'test@gmail.com'
  process.env['SMTP_PASS'] = 'test-pass'
  process.env['NODE_ENV'] = 'test'
}
