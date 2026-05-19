require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// ==========================================
// ROTAS DE BANCO DE DADOS (CRUD)
// ==========================================

app.get('/api/equipamentos', async (req, res) => {
  try {
    const equipamentos = await prisma.equipamento.findMany({
      include: { historicos: true },
    });
    res.json(equipamentos);
  } catch (error) {
    console.error("Erro ao buscar equipamentos:", error);
    res.status(500).json({ error: 'Erro ao buscar dados' });
  }
});

app.get('/api/equipamentos/:id/historico', async (req, res) => {
  try {
    const { id } = req.params;
    const historicos = await prisma.historico.findMany({
      where: { equipamentoId: id },
      orderBy: { dataEnvio: 'desc' }
    });
    res.json(historicos);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar histórico' });
  }
});

app.post('/api/equipamentos', async (req, res) => {
  try {
    const { patrimonio, modelo, numeroSerie, status } = req.body;
    const novoEquipamento = await prisma.equipamento.create({
      data: { patrimonio, modelo, numeroSerie, status },
    });
    res.json(novoEquipamento);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao cadastrar equipamento' });
  }
});

app.delete('/api/equipamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.historico.deleteMany({ where: { equipamentoId: id } });
    await prisma.equipamento.delete({ where: { id } });
    res.json({ message: 'Equipamento deletado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar equipamento' });
  }
});

app.delete('/api/historico/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.historico.delete({ where: { id } });
    res.json({ message: 'Histórico deletado' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao deletar histórico' });
  }
});

app.patch('/api/equipamentos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const atualizado = await prisma.equipamento.update({
      where: { id },
      data: { status },
    });
    res.json(atualizado);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar status' });
  }
});

app.post('/api/equipamentos/:id/atribuir', async (req, res) => {
  try {
    const { id } = req.params;
    const { colaborador, cliente } = req.body;

    await prisma.historico.updateMany({
      where: { equipamentoId: id, dataDevolucao: null },
      data: { dataDevolucao: new Date() }
    });

    const novoHistorico = await prisma.historico.create({
      data: { equipamentoId: id, colaborador, cliente, dataEnvio: new Date() }
    });

    await prisma.equipamento.update({
      where: { id },
      data: { status: 'Ativo' }
    });

    res.json(novoHistorico);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atribuir' });
  }
});

// ==========================================
// INICIANDO O SERVIDOR
// ==========================================
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando lindamente na porta ${PORT}`);
});