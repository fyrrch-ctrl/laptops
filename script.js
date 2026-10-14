// ==========================================
// SUPABASE CONFIG
// ==========================================

const SUPABASE_URL = 'https://tfweumknkcerxmgcceet.supabase.co';
const SUPABASE_KEY = 'sb_publishable_6rzH4-bH0yGYKMQf90K9eg_t9w4IUTA';

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ==========================================
// DOM ELEMENTS
// ==========================================

const tableHead = document.getElementById('table-head');
const tableBody = document.getElementById('laptops');
const countElement = document.getElementById('count');
const statusElement = document.getElementById('status');
const recordsElement = document.getElementById('records');
const errorElement = document.getElementById('error');
const refreshButton = document.getElementById('refresh');

let tableStructure = [];

// ==========================================
// HELPERS
// ==========================================

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const entities = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };

        return entities[character];
    });
}

function setStatus(message, isError = false) {
    if (!statusElement) return;

    statusElement.textContent = message;
    statusElement.style.color = isError ? '#dc2626' : '';
}

function showError(message) {
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.hidden = false;
    }

    setStatus('Ошибка', true);
}

function clearError() {
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.hidden = true;
    }
}

function formatValue(value) {
    if (value === null || value === undefined) {
        return '<span class="null-value">NULL</span>';
    }

    if (typeof value === 'object') {
        return escapeHTML(JSON.stringify(value));
    }

    return escapeHTML(value);
}

// ==========================================
// TABLE STRUCTURE
// ==========================================

async function loadTableStructure() {
    const { data, error } = await supabaseClient.rpc(
        'get_laptops_structure'
    );

    if (error) {
        throw new Error(
            `Не удалось получить структуру таблицы: ${error.message}`
        );
    }

    if (!Array.isArray(data)) {
        throw new Error(
            'RPC вернул неожиданный формат. Ожидался массив столбцов.'
        );
    }

    tableStructure = data;

    renderTableHeader();
    renderStructureInfo();

    return tableStructure;
}

function renderTableHeader() {
    if (!tableHead) {
        throw new Error('В HTML не найден элемент #table-head.');
    }

    tableHead.innerHTML = '';

    const row = document.createElement('tr');

    tableStructure.forEach(column => {
        const th = document.createElement('th');

        th.textContent = column.column_name;

        const details = [
            `Тип: ${column.data_type}`,
            `Допускает NULL: ${column.is_nullable}`,
            `Первичный ключ: ${column.is_primary_key ? 'да' : 'нет'}`
        ];

        if (column.column_default !== null) {
            details.push(`Значение по умолчанию: ${column.column_default}`);
        }

        if (column.is_identity === 'YES') {
            details.push(
                `IDENTITY: ${column.identity_generation || 'да'}`
            );
        }

        th.title = details.join('\n');
        row.appendChild(th);
    });

    tableHead.appendChild(row);
}

// ==========================================
// STRUCTURE INFORMATION
// ==========================================

function renderStructureInfo() {
    let section = document.getElementById('schema-info');

    if (!section) {
        section = document.createElement('section');
        section.id = 'schema-info';

        const table = tableBody?.closest('table');

        if (table) {
            table.insertAdjacentElement('afterend', section);
        } else {
            document.body.appendChild(section);
        }
    }

    section.innerHTML = `
        <h3>Структура таблицы laptops</h3>
        <p>Количество столбцов: ${tableStructure.length}</p>
        <div class="schema-table-wrapper">
            <table class="schema-table">
                <thead>
                    <tr>
                        <th>Столбец</th>
                        <th>Тип данных</th>
                        <th>NULL</th>
                        <th>Ключ</th>
                        <th>По умолчанию</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableStructure.map(column => `
                        <tr>
                            <td>${escapeHTML(column.column_name)}</td>
                            <td>${escapeHTML(column.data_type)}</td>
                            <td>${escapeHTML(column.is_nullable)}</td>
                            <td>${column.is_primary_key ? 'PRIMARY KEY' : '—'}</td>
                            <td>${
                                column.column_default === null
                                    ? '—'
                                    : escapeHTML(column.column_default)
                            }</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
    `;
}

// ==========================================
// LOAD LAPTOP RECORDS
// ==========================================

async function loadLaptops() {
    setStatus('Загрузка...');
    clearError();

    if (refreshButton) {
        refreshButton.disabled = true;
    }

    try {
        // Сначала получаем актуальную структуру таблицы.
        await loadTableStructure();

        // Затем получаем все записи.
        let query = supabaseClient
            .from('laptops')
            .select('*');

        // Если есть первичный ключ laptop_id, сортируем по нему.
        if (tableStructure.some(column => column.column_name === 'laptop_id')) {
            query = query.order('laptop_id', { ascending: true });
        }

        const { data, error } = await query;

        if (error) {
            throw new Error(
                `Не удалось загрузить записи: ${error.message}`
            );
        }

        renderLaptops(data || []);

        if (countElement) {
            countElement.textContent = String((data || []).length);
        }

        if (recordsElement) {
            recordsElement.textContent = `${(data || []).length} записей`;
        }

        setStatus('Подключено');
    } catch (error) {
        console.error('Supabase error:', error);

        showError(error.message || 'Неизвестная ошибка');

        if (tableBody) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="${Math.max(tableStructure.length, 1)}">
                        Не удалось загрузить данные.
                    </td>
                </tr>
            `;
        }
    } finally {
        if (refreshButton) {
            refreshButton.disabled = false;
        }
    }
}

// ==========================================
// RENDER RECORDS
// ==========================================

function renderLaptops(rows) {
    if (!tableBody) {
        throw new Error('В HTML не найден элемент #laptops.');
    }

    tableBody.innerHTML = '';

    if (rows.length === 0) {
        const row = document.createElement('tr');
        const cell = document.createElement('td');

        cell.colSpan = Math.max(tableStructure.length, 1);
        cell.textContent = 'Таблица пока пустая.';

        row.appendChild(cell);
        tableBody.appendChild(row);
        return;
    }

    rows.forEach(record => {
        const row = document.createElement('tr');

        tableStructure.forEach(column => {
            const cell = document.createElement('td');

            cell.innerHTML = formatValue(record[column.column_name]);
            row.appendChild(cell);
        });

        tableBody.appendChild(row);
    });
}

// ==========================================
// EVENTS
// ==========================================

if (refreshButton) {
    refreshButton.addEventListener('click', loadLaptops);
}

// ==========================================
// START
// ==========================================

loadLaptops();
