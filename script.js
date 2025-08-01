// Utilitário: salvar e carregar dados do formulário/tabela
const STORAGE_KEY = 'recessoApostilaData';

function saveData() {
    const escola = getValue('escola');
    const professor = getValue('professor');
    const turma = getValue('turma');
    const rows = getTableRows();
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ escola, professor, turma, rows }));
}

function loadData() {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!data) return;
    setValue('escola', data.escola);
    setValue('professor', data.professor);
    setValue('turma', data.turma);

    const tbody = document.querySelector('#conteudosTable tbody');
    if (tbody) {
        tbody.innerHTML = '';
        (data.rows || []).forEach(vals => addRow(vals));
    }
}

function getValue(id) {
    const el = document.getElementById(id);
    return el ? el.value : '';
}

function setValue(id, value) {
    const el = document.getElementById(id);
    if (el) el.value = value || '';
}

function getTableRows() {
    return Array.from(document.querySelectorAll('#conteudosTable tbody tr')).map(tr =>
        Array.from(tr.querySelectorAll('input')).map(input => input.value)
    );
}

// Adicionar uma nova linha à tabela
function addRow(values = ['', '', '', '']) {
    const tbody = document.querySelector('#conteudosTable tbody');
    if (!tbody) return;
    const tr = document.createElement('tr');

    ['Disciplina', 'Conteúdos', 'Dia Letivo', 'Carga Horária'].forEach((label, i) => {
        const td = document.createElement('td');
        const input = document.createElement('input');
        input.type = 'text';
        input.required = true;
        input.value = values[i] || '';
        input.placeholder = label;
        input.className = 'campo-tabela';
        input.addEventListener('input', saveData);
        td.appendChild(input);
        tr.appendChild(td);
    });

    // Botão remover estilizado
    const tdRemove = document.createElement('td');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'remover-linha-btn';
    btn.innerHTML = '🗑️ Remover';
    btn.addEventListener('click', () => {
        tr.remove();
        saveData();
    });
    tdRemove.appendChild(btn);
    tr.appendChild(tdRemove);
    tbody.appendChild(tr);
    saveData();
}

// Validação dos campos do formulário
function validateForm() {
    let valid = true;
    ['escola', 'professor', 'turma'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!el.value.trim()) {
            el.style.borderColor = '#e53935';
            valid = false;
        } else {
            el.style.borderColor = '#b6c2d9';
        }
    });

    // Validação das linhas da tabela
    const rows = document.querySelectorAll('#conteudosTable tbody tr');
    if (rows.length === 0) valid = false;
    rows.forEach(tr => {
        tr.querySelectorAll('input').forEach(input => {
            if (!input.value.trim()) {
                input.style.borderColor = '#e53935';
                valid = false;
            } else {
                input.style.borderColor = '#b6c2d9';
            }
        });
    });
    return valid;
}

function exportPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // -------- CABEÇALHO ESCOLA/PROFESSORA/TURMA -----------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);

    // Desenhar as 3 linhas de caixa separadas (iguais à escola/prova)
    let baseY = 18, boxHeight = 8;
    doc.rect(18, baseY, 174, boxHeight); // escola
    doc.rect(18, baseY + boxHeight, 174, boxHeight); // professora
    doc.rect(18, baseY + 2 * boxHeight, 174, boxHeight); // turma

    // Pega os dados do formulário (ajuste se preferir usar fixos ou dinâmicos)
    const escola = getValue('escola') || 'Nome da Escola';
    const professor = getValue('professor') || 'Nome do Professor(a)';
    const turma = getValue('turma') || 'Turma';

    // Escola
    doc.text("ESCOLA:", 21, baseY + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(escola, 45, baseY + 5.5);

    // Professora
    doc.setFont('helvetica', 'bold');
    doc.text("PROFESSORA:", 21, baseY + boxHeight + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(professor, 54, baseY + boxHeight + 5.5);

    // Turma
    doc.setFont('helvetica', 'bold');
    doc.text("TURMA:", 21, baseY + 2*boxHeight + 5.5);
    doc.setFont('helvetica', 'normal');
    doc.text(turma, 37, baseY + 2*boxHeight + 5.5);

    // ------------- TÍTULO CENTRALIZADO (CAIXA ALTA, NEGRITO) -------------
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.text('CONTEÚDOS DO MATERIAL APOSTILADO DO RECESSO ESCOLAR', 105, 44, { align: 'center' });

    // ------------- TABELA: EXEMPLO AGRUPADO (AQUI VOCÊ PODE GERAR DINAMICAMENTE) -------------

    // Exemplo de dados agrupados por disciplina
    const dadosTabela = [
      {
        disciplina: "PORTUGUÊS",
        linhas: [
          ["Escrita de palavras", "17/07", "2h/aula"],
          ["Consoante G", "21/07", "2h/aula"],
          ["Formação de sílabas com a letra G", "24/07", "2h/aula"],
          ["Consoante J", "28/07", "2h/aula"],
          ["Consoante L", "31/07", "2h/aula"]
        ]
      }
      // Adicione outros blocos de disciplina conforme seu agrupamento!
    ];

    // Monta o body do autoTable com rowspan para disciplina
    let body = [];
    dadosTabela.forEach(disc => {
      disc.linhas.forEach((linha, i) => {
        if (i === 0) {
          body.push([
            { content: disc.disciplina, rowSpan: disc.linhas.length, styles: { fontStyle: 'bold', halign: 'left', valign: 'middle' } },
            linha[0], linha[1], linha[2]
          ]);
        } else {
          body.push(['', linha[0], linha[1], linha[2]]);
        }
      });
    });

doc.autoTable({
    startY: 55,
    head: [['DISCIPLINA', 'CONTEÚDOS', 'DIA LETIVO', 'CARGA HORÁRIA']],
    body: body, // Substitua pelo seu array já montado!
    styles: {
        font: 'helvetica',
        fontSize: 12,
        cellPadding: { top: 5, bottom: 5, left: 5, right: 5 },
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.6,
        valign: 'middle'
    },
    headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        fontSize: 12,
        valign: 'middle',
        lineWidth: 0.7
    },
    bodyStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontSize: 12,
        halign: 'center',
        valign: 'middle'
    },
    columnStyles: {
        0: { cellWidth: 40, halign: 'left', fontStyle: 'bold' }
    },
    theme: 'grid',
    margin: { left: 18, right: 18 },
    didParseCell: function (data) {
        // Caixa alta no cabeçalho e coluna disciplina
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
}
