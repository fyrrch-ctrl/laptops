const SUPABASE_URL =
  'https://tfweumknkcerxmgcceet.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_6rzH4-bH0yGYKMQf90K9eg_t9w4IUTA';

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Элементы страницы
const table = document.querySelector('table');
const tableHead = table.querySelector('thead');
const tableBody = document.getElementById('laptops');

const countElement = document.getElementById('count');
const statusElement = document.getElementById('status');
const recordsElement = document.getElementById('records');
const errorElement = document.getElementById('error');
const refreshButton = document.getElementById('refresh');

// Получение структуры и данных таблицы
async function loadLaptops() {
  refreshButton.disabled = true;
  statusElement.textContent = 'Загрузка...';
  errorElement.hidden = true;

  tableHead.replaceChildren();
  tableBody.replaceChildren();

  const loadingRow = document.createElement('tr');
  const loadingCell = document.createElement('td');

  loadingCell.colSpan = 100;
  loadingCell.className = 'message';
  loadingCell.textContent = 'Загрузка данных...';

  loadingRow.appendChild(loadingCell);
  tableBody.appendChild(loadingRow);

  try {
    // 1. Получаем структуру таблицы из RPC-функции
    const { data: columns, error: schemaError } =
      await client.rpc('get_laptops_structure');

    if (schemaError) {
      throw new Error(
        `Ошибка получения структуры: ${schemaError.message}`
      );
    }

    if (!Array.isArray(columns) || columns.length === 0) {
      throw new Error(
        'Структура таблицы не найдена или таблица не содержит столбцов.'
      );
    }

    // 2. Получаем все записи
    const { data, error } = await client
      .from('laptops')
      .select('*')
      .order('laptop_id', { ascending: true });

    if (error) {
      throw new Error(
        `Ошибка загрузки записей: ${error.message}`
      );
    }

    // 3. Создаём шапку таблицы автоматически
    const headerRow = document.createElement('tr');

    for (const column of columns) {
      const th = document.createElement('th');

      th.textContent = column.column_name;
      th.title = `Тип данных: ${column.data_type}`;

      headerRow.appendChild(th);
    }

    tableHead.appendChild(headerRow);

    // 4. Обновляем счётчики
    countElement.textContent = data.length;
    recordsElement.textContent = `${data.length} записей`;

    // 5. Если записей нет
    if (data.length === 0) {
      const row = document.createElement('tr');
      const cell = document.createElement('td');

      cell.colSpan = columns.length;
      cell.className = 'message';
      cell.textContent = 'Таблица пока пуста.';

      row.appendChild(cell);
      tableBody.replaceChildren(row);

      statusElement.textContent = 'Подключено';
      return;
    }

    // 6. Создаём строки по структуре таблицы
    const fragment = document.createDocumentFragment();

    for (const laptop of data) {
      const row = document.createElement('tr');

      for (const column of columns) {
        const td = document.createElement('td');
        const value = laptop[column.column_name];

        if (value === null || value === undefined) {
          td.textContent = '—';
        } else if (
          typeof value === 'object'
        ) {
          td.textContent = JSON.stringify(value);
        } else {
          td.textContent = String(value);
        }

        row.appendChild(td);
      }

      fragment.appendChild(row);
    }

    tableBody.replaceChildren(fragment);

    statusElement.textContent = 'Подключено';

  } catch (error) {
    console.error(error);

    statusElement.textContent = 'Ошибка';
    countElement.textContent = '—';
    recordsElement.textContent = 'Ошибка загрузки';

    tableHead.replaceChildren();
    tableBody.replaceChildren();

    errorElement.textContent = error.message;
    errorElement.hidden = false;

  } finally {
    refreshButton.disabled = false;
  }
}

// Кнопка обновления
refreshButton.addEventListener('click', loadLaptops);

// Первичная загрузка
loadLaptops();
