import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get("active") === "true";

    const teachers = await prisma.teacher.findMany({
      where: activeOnly ? { active: true } : {},
      orderBy: { name: "asc" },
    });
    return NextResponse.json(teachers);
  } catch (error) {
    console.error("Error fetching teachers:", error);
    return NextResponse.json({ error: "Erro ao buscar professores" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, phone, email, active } = body;

    if (!name || !phone) {
      return NextResponse.json({ error: "Nome e telefone são obrigatórios" }, { status: 400 });
    }

    const teacher = await prisma.teacher.create({
      data: {
        name,
        phone,
        email: email || null,
        active: active !== undefined ? active : true
      },
    });

    return NextResponse.json(teacher);
  } catch (error) {
    console.error("Error creating teacher:", error);
    return NextResponse.json({ error: "Erro ao criar professor. Verifique se o telefone já está cadastrado." }, { status: 500 });
  }
}
