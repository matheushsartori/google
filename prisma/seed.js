const { PrismaClient } = require('@prisma/client')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

// Switch to Direct URL if available to avoid Accelerate issues in Seed
if (process.env.DATABASE_URL_NO_ACCELERATE) {
    process.env.DATABASE_URL = process.env.DATABASE_URL_NO_ACCELERATE
    console.log('🔄 Switched to DATABASE_URL_NO_ACCELERATE for seeding')
}

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
})

async function main() {
    console.log('🌱 Starting seed...')

    // 1. Create Default User (Admin)
    const adminEmail = 'admin@mercestenis.com.br'
    const admin = await prisma.user.upsert({
        where: { email: adminEmail },
        update: {},
        create: {
            email: adminEmail,
            name: 'Administrador',
            password: 'admin_password_hash',
        },
    })
    console.log(`👤 Admin created: ${admin.email}`)

    // 2. Create Default Settings
    const defaultSettings = [
        { key: 'AI_PROVIDER', value: 'openai' },
        { key: 'AI_TOKEN', value: '' },
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
