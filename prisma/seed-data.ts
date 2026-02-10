import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const defaultAutomations = [
    {
        stage: "PENDING",
        active: true,
        teacherMsg: "🔔 *Novo Lead:* {teacher_name}, temos um novo interessado em aula de {sport}:\n👤 *Aluno:* {student_name}\n📱 *WhatsApp:* {student_phone}\n\nFique atento para o agendamento!",
        studentMsg: "Olá {student_name}! 👋\n\nRecebemos seu pedido para uma aula experimental de *{sport}*! 🎾\n\nNossa equipe já está revisando as disponibilidades e entraremos em contato em breve para confirmar seu horário. Se tiver alguma dúvida, pode mandar por aqui!"
    },
    {
        stage: "CONFIRMED",
        active: true,
        teacherMsg: "🗓️ *Novo Agendamento!*\n\n{teacher_name}, você tem uma aula marcada:\n👤 *Aluno:* {student_name}\n📍 *Local:* {court_name}\n📅 *Data:* {date}\n⏰ *Hora:* {time}\n\nBom treino! 🔥",
        studentMsg: "Tudo pronto, {student_name}! ✅\n\nSua aula experimental de *{sport}* está confirmada!\n\n📅 *Data:* {date}\n⏰ *Horário:* {time}\n📍 *Local:* {court_name}\n👨‍🏫 *Professor:* {teacher_name}\n\nEstamos ansiosos para te ver em quadra! Chegue com 10 minutinhos de antecedência. 🎾🚀"
    },
    {
        stage: "COMPLETED",
        active: true,
        teacherMsg: "✅ *Aula Finalizada!*\n\n{teacher_name}, a aula com *{student_name}* na *{court_name}* foi marcada como realizada.\n\nNão esqueça de verificar se o aluno tem interesse em fechar um plano mensal!",
        studentMsg: "Olá {student_name}! 🎾\n\nEsperamos que tenha gostado da sua aula de *{sport}* hoje com o professor *{teacher_name}*!\n\nFoi um prazer ter você conosco. Ficou com alguma dúvida sobre nossos planos ou horários fixos? Estamos à disposição para te ajudar a continuar evoluindo! 🚀"
    },
    {
        stage: "CANCELLED",
        active: true,
        teacherMsg: "❌ *Aula Cancelada*\n\n{teacher_name}, a aula com *{student_name}* que seria em {date} às {time} foi cancelada no sistema.",
        studentMsg: "Olá {student_name}. 👋\n\nInformamos que sua aula de *{sport}* agendada para {date} às {time} foi cancelada.\n\nSe desejar reagendar para um novo horário, basta nos avisar por aqui! 😊"
    }
];

const courts = [
    { name: "Quadra 1", color: "#d4af37" },
    { name: "Quadra 2", color: "#3b82f6" },
    { name: "Quadra 3", color: "#10b981" },
    { name: "Quadra 4", color: "#8b5cf6" },
    { name: "Quadra 5", color: "#f43f5e" },
    { name: "Quadra 6", color: "#f59e0b" },
    { name: "Quadra 7", color: "#06b6d4" },
    { name: "Quadra 8", color: "#ec4899" },
    { name: "Quadra 9", color: "#d4af37" },
];

async function main() {
    console.log("🚀 Iniciando seed do banco de dados...");

    // Seed Automations
    console.log("Semeando automações...");
    for (const auto of defaultAutomations) {
        await prisma.automation.upsert({
            where: { stage: auto.stage },
            update: auto,
            create: auto,
        });
    }

    // Seed Courts
    console.log("Semeando quadras (1 a 9)...");
    for (const court of courts) {
        await prisma.court.upsert({
            where: { name: court.name }, // Assuming name is unique or used for identify
            update: court,
            create: court,
        });
    }

    console.log("✅ Banco de dados atualizado com sucesso! 🚀");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
