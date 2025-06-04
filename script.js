// Функція для переключення вкладок
function openTab(tabId) {
    // Сховати всі вкладки
    const tabContents = document.getElementsByClassName('tab-content');
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove('active');
    }
    
    // Видалити активний клас з усіх кнопок
    const tabButtons = document.getElementsByClassName('tab-button');
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove('active');
    }
    
    // Показати вибрану вкладку і зробити кнопку активною
    document.getElementById(tabId).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Функція для додавання нового ЕП у вкладці групи
function addEP() {
    const epList = document.getElementById('ep-list');
    const epCount = epList.getElementsByClassName('ep-item').length + 1;
    
    const newEP = document.createElement('div');
    newEP.className = 'ep-item';
    newEP.innerHTML = `
        <h3>Електроприймач ${epCount}</h3>
        <div class="input-group">
            <label>Найменування:</label>
            <input type="text" class="ep-name" value="Електроприймач ${epCount}">
        </div>
        <div class="input-group">
            <label>Кількість:</label>
            <input type="number" class="ep-count" min="1" value="1">
        </div>
        <div class="input-group">
            <label>Потужність, кВт:</label>
            <input type="number" class="ep-power" step="0.1" min="0" value="10">
        </div>
        <div class="input-group">
            <label>Коефіцієнт використання:</label>
            <input type="number" class="ep-kv" step="0.01" min="0" max="1" value="0.5">
        </div>
        <div class="input-group">
            <label>tg φ:</label>
            <input type="number" class="ep-tgfi" step="0.01" min="0" value="0.75">
        </div>
    `;
    
    epList.appendChild(newEP);
}

// Функція для розрахунку одного ЕП
function calculateSingleEP() {
    // Отримання вхідних даних
    const name = document.getElementById('ep-name').value;
    const count = parseInt(document.getElementById('ep-count').value);
    const power = parseFloat(document.getElementById('ep-power').value);
    const efficiency = parseFloat(document.getElementById('ep-efficiency').value);
    const cosfi = parseFloat(document.getElementById('ep-cosfi').value);
    const voltage = parseFloat(document.getElementById('ep-voltage').value);
    const kv = parseFloat(document.getElementById('ep-kv').value);
    const tgfi = parseFloat(document.getElementById('ep-tgfi').value);
    
    // Розрахунки
    const totalPower = count * power;
    const activePower = kv * totalPower;
    const reactivePower = activePower * tgfi;
    const apparentPower = Math.sqrt(Math.pow(activePower, 2) + Math.pow(reactivePower, 2));
    
    // Розрахунок струму
    const current = (activePower * 1000) / (Math.sqrt(3) * voltage * cosfi * efficiency);
    
    // Формування результату
    let resultHTML = `
        <h3>Результати розрахунку для ${name}:</h3>
        <table>
            <tr>
                <th>Показник</th>
                <th>Значення</th>
            </tr>
            <tr>
                <td>Загальна номінальна потужність (n·Pн)</td>
                <td>${totalPower.toFixed(2)} кВт</td>
            </tr>
            <tr>
                <td>Розрахункове активне навантаження (Pр)</td>
                <td>${activePower.toFixed(2)} кВт</td>
            </tr>
            <tr>
                <td>Розрахункове реактивне навантаження (Qр)</td>
                <td>${reactivePower.toFixed(2)} квар</td>
            </tr>
            <tr>
                <td>Повна потужність (Sр)</td>
                <td>${apparentPower.toFixed(2)} кВ·А</td>
            </tr>
            <tr>
                <td>Розрахунковий струм (Iр)</td>
                <td>${current.toFixed(2)} А</td>
            </tr>
        </table>
    `;
    
    document.getElementById('single-ep-result').innerHTML = resultHTML;
}

// Функція для розрахунку групи ЕП
function calculateGroupEP() {
    const epItems = document.getElementsByClassName('ep-item');
    let totalPower = 0;
    let sumKvPower = 0;
    let sumKvPowerTgfi = 0;
    let sumPowerSquared = 0;
    let epNames = [];
    
    // Збір даних з усіх ЕП
    for (let i = 0; i < epItems.length; i++) {
        const item = epItems[i];
        const count = parseInt(item.querySelector('.ep-count').value);
        const power = parseFloat(item.querySelector('.ep-power').value);
        const kv = parseFloat(item.querySelector('.ep-kv').value);
        const tgfi = parseFloat(item.querySelector('.ep-tgfi').value);
        const name = item.querySelector('.ep-name').value;
        
        const nPower = count * power;
        const kvPower = kv * nPower;
        const kvPowerTgfi = kvPower * tgfi;
        const powerSquared = nPower * nPower;
        
        totalPower += nPower;
        sumKvPower += kvPower;
        sumKvPowerTgfi += kvPowerTgfi;
        sumPowerSquared += powerSquared;
        
        epNames.push(`${name} (${count}×${power} кВт)`);
    }
    
    // Розрахунок групових показників
    const groupKv = sumKvPower / totalPower;
    const effectiveCount = Math.round(Math.pow(totalPower, 2) / sumPowerSquared);
    
    // Визначення коефіцієнта максимуму (спрощений підхід)
    let kp = 1.25; // За замовчуванням
    if (groupKv <= 0.2) {
        if (effectiveCount <= 10) kp = 1.4;
        else if (effectiveCount <= 20) kp = 1.3;
        else kp = 1.25;
    } else if (groupKv <= 0.3) {
        if (effectiveCount <= 10) kp = 1.3;
        else if (effectiveCount <= 20) kp = 1.2;
        else kp = 1.15;
    } else {
        kp = 1.1;
    }
    
    // Розрахунок навантажень
    const activePower = kp * sumKvPower;
    const reactivePower = 1.0 * sumKvPowerTgfi; // Для ШР коефіцієнт 1.0
    const apparentPower = Math.sqrt(Math.pow(activePower, 2) + Math.pow(reactivePower, 2));
    const current = activePower / (Math.sqrt(3) * 0.38 * 0.9); // Напруга 0.38 кВ, cos φ ≈ 0.9
    
    // Формування результату
    let resultHTML = `
        <h3>Результати розрахунку для групи ЕП:</h3>
        <p><strong>Склад групи:</strong> ${epNames.join(', ')}</p>
        <table>
            <tr>
                <th>Показник</th>
                <th>Значення</th>
            </tr>
            <tr>
                <td>Загальна номінальна потужність (Σn·Pн)</td>
                <td>${totalPower.toFixed(2)} кВт</td>
            </tr>
            <tr>
                <td>Груповий коефіцієнт використання (Кв)</td>
                <td>${groupKv.toFixed(4)}</td>
            </tr>
            <tr>
                <td>Ефективна кількість ЕП (nе)</td>
                <td>${effectiveCount}</td>
            </tr>
            <tr>
                <td>Розрахунковий коефіцієнт активної потужності (Kр)</td>
                <td>${kp.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Розрахункове активне навантаження (Pр)</td>
                <td>${activePower.toFixed(2)} кВт</td>
            </tr>
            <tr>
                <td>Розрахункове реактивне навантаження (Qр)</td>
                <td>${reactivePower.toFixed(2)} квар</td>
            </tr>
            <tr>
                <td>Повна потужність (Sр)</td>
                <td>${apparentPower.toFixed(2)} кВ·А</td>
            </tr>
            <tr>
                <td>Розрахунковий груповий струм (Iр)</td>
                <td>${current.toFixed(2)} А</td>
            </tr>
        </table>
    `;
    
    document.getElementById('group-ep-result').innerHTML = resultHTML;
}

// Функція для розрахунку навантаження цеху
function calculateWorkshop() {
    const shrCount = parseInt(document.getElementById('workshop-shr-count').value);
    const largeEpCount = parseInt(document.getElementById('workshop-large-ep-count').value);
    
    // Припустимо, що кожен ШР має однакові параметри як у прикладі
    const shrActivePower = 118.95;
    const shrReactivePower = 107.30;
    const shrApparentPower = 160.20;
    const shrCurrent = 313.02;
    
    // Великі ЕП (як у прикладі)
    const largeEpActivePower = 40 + 192; // Зварювальний трансформатор + сушильна шафа
    const largeEpReactivePower = 120 + 0; // Тільки зварювальний трансформатор має реактивну потужність
    const largeEpApparentPower = Math.sqrt(Math.pow(largeEpActivePower, 2) + Math.pow(largeEpReactivePower, 2));
    const largeEpCurrent = 366.9 + 440.3;
    
    // Розрахунок загального навантаження цеху
    const totalActivePower = shrCount * shrActivePower + largeEpCount * largeEpActivePower;
    const totalReactivePower = shrCount * shrReactivePower + largeEpCount * largeEpReactivePower;
    const totalApparentPower = Math.sqrt(Math.pow(totalActivePower, 2) + Math.pow(totalReactivePower, 2));
    const totalCurrent = shrCount * shrCurrent + largeEpCount * largeEpCurrent;
    
    // Розрахунок для трансформаторної підстанції (зменшені коефіцієнти)
    const workshopKv = 0.32; // Як у прикладі
    const workshopEffectiveCount = 56; // Як у прикладі
    const workshopKp = 0.7; // Для Т0 = 2.5 год.
    
    const transformerActivePower = workshopKp * totalActivePower;
    const transformerReactivePower = workshopKp * totalReactivePower;
    const transformerApparentPower = Math.sqrt(Math.pow(transformerActivePower, 2) + Math.pow(transformerReactivePower, 2));
    const transformerCurrent = transformerActivePower / (Math.sqrt(3) * 0.38 * 0.9);
    
    // Формування результату
    let resultHTML = `
        <h3>Результати розрахунку для цеху:</h3>
        <p><strong>Кількість ШР:</strong> ${shrCount}</p>
        <p><strong>Кількість великих ЕП:</strong> ${largeEpCount}</p>
        
        <h4>Навантаження на шинах 0.38 кВ:</h4>
        <table>
            <tr>
                <th>Показник</th>
                <th>Значення</th>
            </tr>
            <tr>
                <td>Загальне активне навантаження (ΣPр)</td>
                <td>${totalActivePower.toFixed(2)} кВт</td>
            </tr>
            <tr>
                <td>Загальне реактивне навантаження (ΣQр)</td>
                <td>${totalReactivePower.toFixed(2)} квар</td>
            </tr>
            <tr>
                <td>Загальна повна потужність (ΣSр)</td>
                <td>${totalApparentPower.toFixed(2)} кВ·А</td>
            </tr>
            <tr>
                <td>Загальний розрахунковий струм (ΣIр)</td>
                <td>${totalCurrent.toFixed(2)} А</td>
            </tr>
        </table>
        
        <h4>Навантаження на шинах 0.38 кВ ТП (з урахуванням Т0=2.5 год.):</h4>
        <table>
            <tr>
                <th>Показник</th>
                <th>Значення</th>
            </tr>
            <tr>
                <td>Коефіцієнт використання цеху (Кв)</td>
                <td>${workshopKv.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Ефективна кількість ЕП (nе)</td>
                <td>${workshopEffectiveCount}</td>
            </tr>
            <tr>
                <td>Розрахунковий коефіцієнт активної потужності (Kр)</td>
                <td>${workshopKp.toFixed(2)}</td>
            </tr>
            <tr>
                <td>Розрахункове активне навантаження (Pр)</td>
                <td>${transformerActivePower.toFixed(2)} кВт</td>
            </tr>
            <tr>
                <td>Розрахункове реактивне навантаження (Qр)</td>
                <td>${transformerReactivePower.toFixed(2)} квар</td>
            </tr>
            <tr>
                <td>Повна потужність (Sр)</td>
                <td>${transformerApparentPower.toFixed(2)} кВ·А</td>
            </tr>
            <tr>
                <td>Розрахунковий струм (Iр)</td>
                <td>${transformerCurrent.toFixed(2)} А</td>
            </tr>
        </table>
    `;
    
    document.getElementById('workshop-result').innerHTML = resultHTML;
}

// Ініціалізація - додаємо кілька ЕП за замовчуванням
window.onload = function() {
    addEP();
    addEP();
};