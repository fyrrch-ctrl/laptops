const SUPABASE_URL = 'https://tfweumknkcerxmgcceet.supabase.co';

const SUPABASE_KEY =
  'sb_publishable_6rzH4-bH0yGYKMQf90K9eg_t9w4IUTA';

const client = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const tableBody = document.getElementById('laptops');
const countElement = document.getElementById('count');
const statusElement = document.getElementById('status');
const recordsElement = document.getElementById('records');
const errorElement = document.getElementById('error');
const refreshButton = document.getElementById('refresh');

async function loadLaptops() {
  refreshButton.disabled = true;
  statusElement.textContent = 'Загрузка...';
  errorElement.hidden = true;

  tableBody.replaceChildren();

  const loadingRow = document.createElement('tr');
  const loadingCell = document.createElement('td');

  loadingCell.colSpan = 3;
  loadingCell.className = 'message';
  loadingCell.textContent = 'Загрузка данных...';

  loadingRow.appendChild(loadingCell);
  tableBody.appendChild(loadingRow);

  const { data, error } = await client
    .from('laptops')
    .select('laptop_id, name, price')
    .order('laptop_id', { ascending: true });

  refreshButton.disabled = false;

  if (error) {
    statusElement.textContent = 'Ошибка';
    countElement.textContent = '—';
    recordsElement.textContent = 'Ошибка загрузки';
    tableBody.replaceChildren();

    errorElement.textContent =
      'Не удалось загрузить данные: ' + error.message;

    errorElement.hidden = false;
    return;
  }

  statusElement.textContent = 'Подключено';
  countElement.textContent = data.length;
  recordsElement.textContent = `${data.length} записей`;

  tableBody.replaceChildren();

  if (data.length === 0) {
    const row = document.createElement('tr');
    const cell = document.createElement('td');

    cell.colSpan = 3;
    cell.className = 'message';
    cell.textContent = 'В таблице пока нет записей.';

    row.appendChild(cell);
    tableBody.appendChild(row);
    return;
  }

  for (const laptop of data) {
    const row = document.createElement('tr');

    const idCell = document.createElement('td');
    idCell.textContent = `#${laptop.laptop_id}`;

    const nameCell = document.createElement('td');
    nameCell.textContent = laptop.name ?? 'Без названия';

    const priceCell = document.createElement('td');
    const price = Number(laptop.price);

    priceCell.textContent = Number.isFinite(price)
      ? `${price.toLocaleString('ru-RU')} ₸`
      : '—';

    row.append(idCell, nameCell, priceCell);
    tableBody.appendChild(row);
  }
}

refreshButton.addEventListener('click', loadLaptops);

loadLaptops();
