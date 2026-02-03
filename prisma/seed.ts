import { PrismaClient } from '@prisma/client'
import 'dotenv/config'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')
    console.log('Database URL exists:', !!process.env.DATABASE_URL)

    // 1. Create Default User (Admin)
    // In a real app, password should be hashed. For dev/seed, we might store plain or a simple hash if auth is implemented.
    // Assuming simple auth or no strict check for now as per "playground" nature, but I'll put a placeholder hash.
    const adminEmail = 'admin@mercestenis.com.br'
    const hashedPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {
            password: hashedPassword
        },
        create: {
            email: adminEmail,
            name: 'Administrador',
            password: hashedPassword,
        },
    })
    console.log(`👤 Admin created: ${admin.email}`)

    // 2. Create Default Settings
    const defaultSettings = [
        { key: 'AI_PROVIDER', value: 'openai' },
        { key: 'AI_TOKEN', value: '' }, // User must fill this
        { key: 'LINKS_LETZPLAY', value: 'https://letzplay.me/merces-tenis' },
        { key: 'LINKS_PIX', value: 'pix@mercestenis.com.br' },
        { key: 'OBJ_EXP_ACTIVE', value: 'true' },
        { key: 'OBJ_EXP_DATA', value: JSON.stringify({ name: true, phone: true, level: true, availability: true }) },
        {
            key: 'AI_PROMPT',
            value: `Você é o atendente virtual exclusivo do Mercês Tênis. 
Seu objetivo é:
1. Identificar se o cliente quer agendar aula (experimental/avulsa) ou reservar quadra.
2. Solicitar informações básicas se necessário (Nome, Nível).
3. Direcionar para o link correto ou enviar chave PIX.

Regras:
- Sempre consulte o link do LetzPlay para disponibilidade.
- Para pagamentos, envie a chave PIX informada.
- Seja esportivo, educado e use emojis de tênis 🎾.
- Caso não saiba algo, peça para aguardar um atendente humano.`
        },
    ]

    for (const setting of defaultSettings) {
        await prisma.settings.upsert({
            where: { key: setting.key },
            update: {},
            create: setting,
        })
    }
    console.log('⚙️  Default settings loaded')

    // 3. Create a Default Instance
    await prisma.connectionInstance.upsert({
        where: { instanceId: 'evolution_main' },
        update: {},
        create: {
            name: 'Evolution Principal',
            instanceId: 'evolution_main',
            status: 'DISCONNECTED',
            version: 'v1.6.2',
            type: 'WhatsApp Business',
            webhookStatus: 'INACTIVE'
        }
    })
    console.log('📡 Default instance created')

    console.log('✅ Seed finished successfully')
}



main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
