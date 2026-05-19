import React, { useEffect, useState } from 'react'
import * as pdfMakeLib from 'pdfmake/build/pdfmake';
import * as pdfFontsLib from 'pdfmake/build/vfs_fonts';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import logoEletron from './assets/logo-eletron.png'

const pdfMake = (pdfMakeLib as any).default || pdfMakeLib;
const pdfFonts = (pdfFontsLib as any).default || pdfFontsLib;
pdfMake.vfs = pdfFonts.pdfMake ? pdfFonts.pdfMake.vfs : pdfFonts.vfs;

function App() {
  const [equipamentos, setEquipamentos] = useState<any[]>([])
  const [patrimonio, setPatrimonio] = useState('');
  const [modelo, setModelo] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('')
  const [linhaExpandida, setLinhaExpandida] = useState<string | null>(null)
  const [visaoDashboard, setVisaoDashboard] = useState<'cards' | 'graficos'>('cards')
  const [historicoAtual, setHistoricoAtual] = useState<any[]>([])
  const [busca, setBusca] = useState('')
  const [equipamentoParaAtribuir, setEquipamentoParaAtribuir] = useState<string | null>(null)
  const [nomeColaborador, setNomeColaborador] = useState('');
  const [nomeCliente, setNomeCliente] = useState('')

  const [isLogado, setIsLogado] = useState(false)
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erroLogin, setErroLogin] = useState('')

  const carregarEquipamentos = () => {
    fetch('http://localhost:3001/api/equipamentos')
      .then(res => res.json())
      .then(dados => setEquipamentos(Array.isArray(dados) ? dados : []));
  }

  const carregarHistorico = (id: string) => {
    fetch(`http://localhost:3001/api/equipamentos/${id}/historico`)
      .then(res => res.json())
      .then(dados => setHistoricoAtual(dados));
  }

  useEffect(() => {
    if (isLogado) carregarEquipamentos();
  }, [isLogado])

  const fazerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin@eletron.com' && senha === 'admin123') {
      setIsLogado(true);
      setErroLogin('');
    } else {
      setErroLogin('Credenciais incorretas. Tente novamente.');
    }
  }

  const gerarTermo = (equipamento: any) => {
    const historicoAtivo = equipamento.historicos?.find((h: any) => h.dataDevolucao === null);
    if (!historicoAtivo) return alert('Atribua este notebook a um colaborador antes de gerar o termo!');

    const dataAtual = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
    const dataEnvio = new Date(historicoAtivo.dataEnvio).toLocaleDateString('pt-BR');

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [56, 56, 56, 56],
      defaultStyle: { fontSize: 10, color: '#1e293b' },
      content: [
        {
          columns: [
            { stack: [{ text: 'ELÉTRON', fontSize: 22, bold: true, color: '#f97316' }, { text: 'Active Administrator', fontSize: 9, color: '#64748b' }] },
            { stack: [{ text: 'TERMO DE RESPONSABILIDADE', fontSize: 13, bold: true, alignment: 'right' }, { text: `Emitido em: ${dataAtual}`, fontSize: 8, color: '#94a3b8', alignment: 'right' }] },
          ],
        },
        { canvas: [{ type: 'line', x1: 0, y1: 8, x2: 483, y2: 8, lineWidth: 2, lineColor: '#f97316' }], margin: [0, 8, 0, 20] },
        { text: ['Pelo presente, ', { text: historicoAtivo.colaborador.toUpperCase(), bold: true }, ', alocado em ', { text: (historicoAtivo.cliente || 'N/A').toUpperCase(), bold: true }, ', declara ter recebido em ', { text: dataEnvio, bold: true }, ', o equipamento abaixo de propriedade da Elétron:'], margin: [0, 0, 0, 16], lineHeight: 1.5 },
        { table: { widths: ['*', '*', '*'], body: [[{ text: 'PATRIMÔNIO', bold: true, fillColor: '#f1f5f9' }, { text: 'MODELO', bold: true, fillColor: '#f1f5f9' }, { text: 'SÉRIE', bold: true, fillColor: '#f1f5f9' }], [equipamento.patrimonio, equipamento.modelo, equipamento.numeroSerie]] }, margin: [0, 0, 0, 20] },
        { text: 'Comprometo-me a zelar pelo equipamento e devolvê-lo ao fim do contrato ou quando solicitado.', margin: [0, 20, 0, 40] },
        { columns: [{ stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] }, { text: historicoAtivo.colaborador, bold: true, margin: [0, 5] }, { text: 'Colaborador' }] }, { stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 200, y2: 0, lineWidth: 1 }] }, { text: 'Responsável TI', bold: true, margin: [0, 5] }, { text: 'Elétron' }] }] }
      ]
    };

    pdfMake.createPdf(docDefinition).download(`Termo_${equipamento.patrimonio}_${historicoAtivo.colaborador.replace(/\s+/g, '_')}.pdf`);
  }

  const apagarEquipamento = async (id: string) => {
    if (!confirm("Excluir este ativo e seu histórico permanentemente?")) return;
    await fetch(`http://localhost:3001/api/equipamentos/${id}`, { method: 'DELETE' });
    carregarEquipamentos();
  }

  const mudarStatus = async (id: string, novoStatus: string) => {
    await fetch(`http://localhost:3001/api/equipamentos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: novoStatus }) });
    carregarEquipamentos();
  }

  const atribuirEquipamento = async (id: string) => {
    if (!nomeColaborador || !nomeCliente) return alert("Preencha todos os campos!");
    await fetch(`http://localhost:3001/api/equipamentos/${id}/atribuir`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ colaborador: nomeColaborador, cliente: nomeCliente }) });
    setEquipamentoParaAtribuir(null); setNomeColaborador(''); setNomeCliente(''); carregarEquipamentos();
  }

  const salvarNotebook = async (e: any) => {
    e.preventDefault();
    await fetch('http://localhost:3001/api/equipamentos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ patrimonio, modelo, numeroSerie, status: 'Disponível' }) });
    setPatrimonio(''); setModelo(''); setNumeroSerie(''); carregarEquipamentos();
  }

  const equipamentosFiltrados = equipamentos.filter(eq => {
    const termo = busca.toLowerCase();
    const portadores = eq.historicos?.map((h: any) => h.colaborador.toLowerCase()).join(' ') || '';
    return eq.patrimonio.toLowerCase().includes(termo) || eq.modelo.toLowerCase().includes(termo) || portadores.includes(termo);
  });

  const total = equipamentosFiltrados.length;
  const emUso = equipamentosFiltrados.filter(e => e.status === 'Ativo').length;
  const disponiveis = equipamentosFiltrados.filter(e => e.status === 'Disponível').length;
  const manutencao = equipamentosFiltrados.filter(e => e.status === 'Manutenção').length;
  const dataGrafico = [{ name: 'Ativos', value: emUso, color: '#28A745' }, { name: 'Estoque', value: disponiveis, color: '#007BFF' }, { name: 'Manutenção', value: manutencao, color: '#f97316' }];

  if (!isLogado) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-header">
            <img src={logoEletron} alt="Logo" />
            <h1>Acesso Restrito</h1>
            <p>TI - Elétron Active Admin</p>
          </div>
          <form onSubmit={fazerLogin} className="login-form">
            <div className="form-group-login">
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@eletron.com" required />
            </div>
            <div className="form-group-login">
              <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="Senha" required />
            </div>
            {erroLogin && <p className="error-message">{erroLogin}</p>}
            <button type="submit" className="btn-login">Acessar Painel</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <img src={logoEletron} alt="Logo" className="navbar-logo" />
          <div className="navbar-title">
            <h1>Elétron</h1>
            <span>Active Administrator</span>
          </div>
        </div>
        <button onClick={() => setIsLogado(false)} className="navbar-logout">Sair</button>
      </nav>

      <main className="dashboard-container">
        <div className="dashboard-hero">
          <h2>Controle de Ativos. <span className="gradient-word">Simples & Inteligente.</span></h2>
          <p>Gerencie equipamentos, portadores e termos de responsabilidade em uma interface unificada de alta performance.</p>
        </div>

        <div className="dashboard-header">
          <h2 className="dashboard-title">Visão Geral</h2>
          <div className="view-toggle">
            <button onClick={() => setVisaoDashboard('cards')} className={`toggle-btn ${visaoDashboard === 'cards' ? 'active' : ''}`}>Cards</button>
            <button onClick={() => setVisaoDashboard('graficos')} className={`toggle-btn ${visaoDashboard === 'graficos' ? 'active' : ''}`}>Gráficos</button>
          </div>
        </div>

        {visaoDashboard === 'cards' ? (
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-total">📊</div>
              <div className="stat-info">
                <p className="stat-label">Total</p>
                <h2 className="stat-value">{total}</h2>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-active">👤</div>
              <div className="stat-info">
                <p className="stat-label">Ativos</p>
                <h2 className="stat-value">{emUso}</h2>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-stock">📦</div>
              <div className="stat-info">
                <p className="stat-label">Estoque</p>
                <h2 className="stat-value">{disponiveis}</h2>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon-wrapper stat-icon-maintenance">🔧</div>
              <div className="stat-info">
                <p className="stat-label">Manutenção</p>
                <h2 className="stat-value">{manutencao}</h2>
              </div>
            </div>
          </div>
        ) : (
          <div className="chart-card">
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={dataGrafico} cx="50%" cy="100%" startAngle={180} endAngle={0} innerRadius={70} outerRadius={110} paddingAngle={2} dataKey="value">
                    {dataGrafico.map((e, i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="chart-legend">
              {dataGrafico.map(item => (
                <div key={item.name} className="legend-item">
                  <div className="legend-color" style={{ backgroundColor: item.color }}></div>
                  <span className="legend-text">{item.name}: {item.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="search-bar">
          <input type="text" placeholder="Filtrar por Patrimônio, Portador..." className="search-input" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>

        <div className="form-card">
          <h3 className="form-title">Novo Cadastro de Equipamento</h3>
          <form onSubmit={salvarNotebook} className="form-grid">
            <input placeholder="Patrimônio" value={patrimonio} onChange={e => setPatrimonio(e.target.value)} required className="form-input" />
            <input placeholder="Modelo" value={modelo} onChange={e => setModelo(e.target.value)} required className="form-input" />
            <input placeholder="Serial" value={numeroSerie} onChange={e => setNumeroSerie(e.target.value)} required className="form-input" />
            <button type="submit" className="btn-submit">Salvar Ativo</button>
          </form>
        </div>

        <div className="table-card">
          <table className="assets-table">
            <thead className="table-head">
              <tr>
                <th style={{ width: '60px' }}></th>
                <th>Patrimônio</th>
                <th>Modelo</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentosFiltrados.map(eq => (
                <React.Fragment key={eq.id}>
                  <tr className="table-row">
                    <td className="table-cell">
                      <button className="btn-expand" onClick={() => { if (linhaExpandida === eq.id) setLinhaExpandida(null); else { setLinhaExpandida(eq.id); carregarHistorico(eq.id); } }}>
                        {linhaExpandida === eq.id ? '▲' : '▼'}
                      </button>
                    </td>
                    <td className="table-cell table-cell-bold">{eq.patrimonio}</td>
                    <td className="table-cell">{eq.modelo}</td>
                    <td className="table-cell">
                      <select value={eq.status} onChange={(e) => mudarStatus(eq.id, e.target.value)} className="status-select">
                        <option value="Ativo">Ativo</option>
                        <option value="Disponível">Disponível</option>
                        <option value="Manutenção">Manutenção</option>
                      </select>
                    </td>
                    <td className="table-cell" style={{ textAlign: 'right' }}>
                      <div className="table-actions">
                        <button onClick={() => apagarEquipamento(eq.id)} className="action-btn btn-action-delete">Excluir</button>
                        <button onClick={() => setEquipamentoParaAtribuir(eq.id)} className="action-btn btn-action-assign">Atribuir</button>
                        <button onClick={() => gerarTermo(eq)} className="action-btn btn-action-pdf">Termo</button>
                      </div>
                    </td>
                  </tr>
                  {linhaExpandida === eq.id && (
                    <tr className="history-row-container">
                      <td colSpan={5}>
                        <div className="history-card">
                          <h4>Histórico de Portadores</h4>
                          <div className="history-list">
                            {historicoAtual.map(h => (
                              <div key={h.id} className="history-item">
                                <span className="history-item-meta">{h.colaborador} - {h.cliente}</span>
                                <span className="history-item-date">Envio: {new Date(h.dataEnvio).toLocaleDateString()}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {equipamentoParaAtribuir && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Nova Atribuição</h3>
            <div className="modal-inputs">
              <input placeholder="Nome Colaborador" value={nomeColaborador} onChange={e => setNomeColaborador(e.target.value)} className="form-input" />
              <input placeholder="Cliente" value={nomeCliente} onChange={e => setNomeCliente(e.target.value)} className="form-input" />
            </div>
            <div className="modal-actions">
              <button onClick={() => setEquipamentoParaAtribuir(null)} className="btn-modal-cancel">Cancelar</button>
              <button onClick={() => atribuirEquipamento(equipamentoParaAtribuir)} className="btn-modal-confirm">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App