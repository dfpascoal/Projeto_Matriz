import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const STORAGE_KEY = 'recessoApostilaData';

const defaultRow = () => ({
  disciplina: '',
  conteudos: '',
  diaLetivo: '',
  cargaHoraria: ''
});

function App() {
  const [escola, setEscola] = useState('');
  const [professor, setProfessor] = useState('');
  const [turma, setTurma] = useState('');
  const [rows, setRows] = useState([defaultRow()]);
  const [orientation, setOrientation] = useState('portrait');

  // Load from localStorage
  useEffect(() => {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (data) {
      setEscola(data.escola || '');
      setProfessor(data.professor || '');
      setTurma(data.turma || '');
      setRows(data.rows && data.rows.length ? data.rows : [defaultRow()]);
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ escola, professor, turma, rows })
    );
  }, [escola, professor, turma, rows]);

  const handleRowChange = (idx, field, value) => {
    setRows(rows => rows.map((row, i) => i === idx ? { ...row, [field]: value } : row));
  };

  const addRow = () => setRows([...rows, defaultRow()]);
  const removeRow = idx => setRows(rows => rows.length === 1 ? rows : rows.filter((_, i) => i !== idx));

  const validate = () => {
    if (!escola.trim() || !professor.trim() || !turma.trim()) return false;
    for (const row of rows) {
      if (!row.disciplina.trim() || !row.conteudos.trim() || !row.diaLetivo.trim() || !row.cargaHoraria.trim()) return false;
    }
    return true;
  };
const exportPDF = () => {
  if (!validate()) {
    alert('Por favor, preencha todos os campos obrigatórios.');
    return;
  }
  const doc = new jsPDF({ orientation });

  // CAIXAS DO CABEÇALHO
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  let baseY = 18, boxHeight = 7;
  doc.rect(20, baseY, 170, boxHeight); // escola
  doc.rect(20, baseY + boxHeight, 170, boxHeight); // professora
  doc.rect(20, baseY + 2 * boxHeight, 170, boxHeight); // turma

  // Escola
  doc.text("ESCOLA:", 23, baseY + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(escola, 47, baseY + 5);

  // Professora
  doc.setFont('helvetica', 'bold');
  doc.text("PROFESSOR(A):", 23, baseY + boxHeight + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(professor, 59, baseY + boxHeight + 5);

  // Turma
  doc.setFont('helvetica', 'bold');
  doc.text("TURMA:", 23, baseY + 2 * boxHeight + 5);
  doc.setFont('helvetica', 'normal');
  doc.text(turma, 40, baseY + 2 * boxHeight + 5);

  // TÍTULO CENTRALIZADO E SEM SOBREPOR CAIXAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13.2);
  doc.text('CONTEÚDOS DO MATERIAL APOSTILADO DO RECESSO ESCOLAR', 105, baseY + 3 * boxHeight + 15, { align: 'center' });

  // AGRUPAMENTO POR DISCIPLINA (igual já faz)
  let grouped = {};
  rows.forEach(r => {
    const disc = r.disciplina.trim().toUpperCase();
    if (!grouped[disc]) grouped[disc] = [];
    grouped[disc].push([r.conteudos, r.diaLetivo, r.cargaHoraria]);
  });

  let body = [];
  Object.keys(grouped).forEach(disciplina => {
    grouped[disciplina].forEach((linha, idx) => {
      if (idx === 0) {
        body.push([
          { content: disciplina, rowSpan: grouped[disciplina].length, styles: { fontStyle: 'bold', halign: 'left', valign: 'middle' } },
          ...linha
        ]);
      } else {
        body.push(['', ...linha]);
      }
    });
  });

  // TABELA CLÁSSICA MELHORADA
  autoTable(doc, {
    startY: baseY + 3 * boxHeight + 19, // começa logo depois do título
    head: [['DISCIPLINA', 'CONTEÚDOS', 'DIA LETIVO', 'CARGA HORÁRIA']],
    body: body,
    styles: {
      font: 'helvetica',
      fontSize: 11.2,
      cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      textColor: [0, 0, 0],
      lineWidth: 0.45,
      lineColor: [0, 0, 0],
      valign: 'middle'
    },
    headStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 11.4,
      halign: 'center',
      valign: 'middle',
      lineWidth: 0.45
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [0, 0, 0],
      fontSize: 11.2,
      halign: 'center',
      valign: 'middle'
    },
    columnStyles: {
      0: { cellWidth: 45, halign: 'left', fontStyle: 'bold' }
    },
    theme: 'grid',
    margin: { left: 20, right: 20 },
    didParseCell: function (data) {
      // Caixa alta no cabeçalho e disciplina
      if (data.row.section === 'head' || (data.column.index === 0 && data.row.section === 'body')) {
        data.cell.text = data.cell.text.map(t => t.toUpperCase());
      }
      // Disciplina em negrito
      if (data.column.index === 0 && data.row.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
      }
    }
  });

  doc.save('Conteúdos do Material Apostilar do Recesso Escolar.pdf');
};
  return (
    <div className="container">
      <h1>Conteúdos do Material Apostilar do Recesso </h1>
      <form id="infoForm" onSubmit={e => e.preventDefault()}>
        <div className="form-group">
          <label htmlFor="escola">Escola *</label>
          <input type="text" id="escola" value={escola} onChange={e => setEscola(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="professor">Professor *</label>
          <input type="text" id="professor" value={professor} onChange={e => setProfessor(e.target.value)} required />
        </div>
        <div className="form-group">
          <label htmlFor="turma">Turma *</label>
          <input type="text" id="turma" value={turma} onChange={e => setTurma(e.target.value)} required />
        </div>
      </form>
      <h2>Adicionar Conteúdos</h2>
      <table id="conteudosTable">
        <thead>
          <tr>
            <th>Disciplina *</th>
            <th>Conteúdos *</th>
            <th>Dia Letivo *</th>
            <th>Carga Horária *</th>
            <th>Ação</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td><input type="text" value={row.disciplina} onChange={e => handleRowChange(idx, 'disciplina', e.target.value)} required placeholder="Disciplina" /></td>
              <td><input type="text" value={row.conteudos} onChange={e => handleRowChange(idx, 'conteudos', e.target.value)} required placeholder="Conteúdos" /></td>
              <td><input type="text" value={row.diaLetivo} onChange={e => handleRowChange(idx, 'diaLetivo', e.target.value)} required placeholder="Dia Letivo" /></td>
              <td><input type="text" value={row.cargaHoraria} onChange={e => handleRowChange(idx, 'cargaHoraria', e.target.value)} required placeholder="Carga Horária" /></td>
              <td><button type="button" onClick={() => removeRow(idx)} style={{background:'#e53935',margin:0,padding:'6px 12px',fontSize:'0.95em'}}>Remover</button></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button id="addRowBtn" type="button" onClick={addRow}>Adicionar Linha</button>
      <div className="export-options">
        <label htmlFor="orientation">Orientação:</label>
        <select id="orientation" value={orientation} onChange={e => setOrientation(e.target.value)}>
          <option value="portrait">Retrato</option>
          <option value="landscape">Paisagem</option>
        </select>
        <button id="exportPDFBtn" type="button" onClick={exportPDF}>Exportar para PDF</button>
      </div>
    </div>
  );
}

export default App; 