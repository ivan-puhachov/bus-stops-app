// DOM Elements
const regionInput = document.getElementById('regionInput');
const regionSuggestions = document.getElementById('regionSuggestions');
const stopInput = document.getElementById('stopInput');
const stopSuggestions = document.getElementById('stopSuggestions');
const resultsDiv = document.getElementById('results');
const clearButton = document.getElementById('clearButton');
const busDetailsDiv = document.getElementById('busDetails');
const regionError = document.getElementById('regionError');
const stopError = document.getElementById('stopError');

// Global variables for data
let regions = [];
let stops = [];
let activeBus = null;
let manualClear = false;


// Show loading spinner
function showLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'block';
}

// Hide loading spinner
function hideLoading() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    loadingIndicator.style.display = 'none';
}




function validateInputs() {
    let isValid = true;

    // Validate region
    if (regionInput.value.trim() === '') {
        regionError.textContent = 'Введите регион.';
        regionError.style.display = 'block';
        isValid = false;
    } else {
        regionError.textContent = '';
        regionError.style.display = 'none';
    }

    // Validate stop
    if (stopInput.value.trim() === '' && !stopInput.disabled) {
        stopError.textContent = 'Введите остановку.';
        stopError.style.display = 'block';
        isValid = false;
    } else {
        stopError.textContent = '';
        stopError.style.display = 'none';
    }

    return isValid;
}

// Очистка ошибок при изменении значения в полях
function clearErrorsOnInput() {
    regionInput.addEventListener('input', () => {
        regionError.textContent = '';
        regionError.style.display = 'none';
    });

    stopInput.addEventListener('input', () => {
        stopError.textContent = '';
        stopError.style.display = 'none';
    });
}

// Вызовите эту функцию сразу после загрузки страницы
clearErrorsOnInput();



// Function: Clear error message on input
function clearErrorOnInput(inputElement, errorElement) {
    inputElement.addEventListener('input', () => {
        if (inputElement.value.trim() !== '') {
            errorElement.textContent = '';
        }
    });
}

regionInput.addEventListener('blur', () => {
    setTimeout(() => {
        if (regionInput.value.trim() === '') {
            regionError.textContent = 'Введите регион.';
            regionError.style.display = 'block';
        }
    }, 100);
});

stopInput.addEventListener('blur', () => {
    setTimeout(() => {
        if (stopInput.value.trim() === '' && !stopInput.disabled) {
            stopError.textContent = 'Введите остановку.';
            stopError.style.display = 'block';
        }
    }, 100);
});

regionInput.addEventListener('focus', () => {
    regionError.textContent = '';
    regionError.style.display = 'none';
});

stopInput.addEventListener('focus', () => {
    stopError.textContent = '';
    stopError.style.display = 'none';
});

// Attach input event listeners for real-time error clearing
clearErrorOnInput(regionInput, regionError);
clearErrorOnInput(stopInput, stopError);

// Example: Add validation before performing actions
document.getElementById('clearButton').addEventListener('click', () => {
    if (validateInputs()) {
        console.log('Input is valid. Proceeding...');
    } else {
        console.log('Validation failed. Please check errors.');
    }
});




// Function: Load regions
async function loadRegions() {


    try {
        showLoading();
        const response = await fetch('https://bus-stops-app.onrender.com/regions');
        regions = await response.json();

        console.log('Regions loaded:', regions);
    } catch (error) {
        console.error('Error loading regions:', error);
    } finally {
        hideLoading();
    }
}


// Function: Clear all fields
// Function: Clear all fields
function clearFields() {
    // Если кнопка "Назад" есть на экране, вызываем ее событие клика
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.click(); // Нажимаем на кнопку "Назад"
    }

    regionInput.value = '';
    stopInput.value = '';
    stopInput.disabled = true;
    regionSuggestions.innerHTML = '';
    stopSuggestions.innerHTML = '';
    resultsDiv.innerHTML = '';
    busDetailsDiv.innerHTML = '';
    activeBus = null;
    manualClear = true;

    // Вызов валидации после очистки
    validateInputs();
}


// Clear button functionality
clearButton.addEventListener('click', clearFields);

// Function: Update suggestions
function updateSuggestions(inputElement, suggestionsContainer, items, onClick) {
    const query = inputElement.value.toLowerCase();
    suggestionsContainer.innerHTML = '';

    const filteredItems = query.length === 0 ? items : items.filter(item => item.toLowerCase().includes(query));

    filteredItems.forEach(item => {
        const li = document.createElement('li');
        li.textContent = item;
        li.className = 'list-group-item';

        // Используем mousedown, чтобы обработать клик до blur
        li.addEventListener('mousedown', (e) => {
            e.preventDefault();
            inputElement.value = item;

            // Сбрасываем ошибки
            if (inputElement === regionInput) {
                regionError.textContent = '';
                regionError.style.display = 'none';
            }
            if (inputElement === stopInput) {
                stopError.textContent = '';
                stopError.style.display = 'none';
            }

            onClick(item);
            suggestionsContainer.style.display = 'none';
        });

        suggestionsContainer.appendChild(li);
    });

    suggestionsContainer.style.display = filteredItems.length > 0 ? 'block' : 'none';
}

// Убедитесь, что при уходе с поля ввода меню не закрывается сразу
regionInput.addEventListener('blur', (e) => {
    setTimeout(() => {
        regionSuggestions.style.display = 'none';
    }, 150); // Небольшая задержка для завершения клика
});

stopInput.addEventListener('blur', (e) => {
    setTimeout(() => {
        stopSuggestions.style.display = 'none';
    }, 150); // Небольшая задержка для завершения клика
});




// Event handler for region input field
regionInput.addEventListener('focus', () => {
    updateSuggestions(regionInput, regionSuggestions, regions, region => {
        clearFieldsOnRegionChange(region);
        loadStops(region);
    });
});

regionInput.addEventListener('input', () => {
    updateSuggestions(regionInput, regionSuggestions, regions, region => {
        clearFieldsOnRegionChange(region); // Сбрасываем данные для нового региона
        loadStops(region); // Загружаем остановки для нового региона
    });
});


// Function: Clear fields when changing the region
function clearFieldsOnRegionChange(region) {
    stopInput.value = '';
    stopInput.disabled = true;
    stopSuggestions.innerHTML = '';
    resultsDiv.innerHTML = '';
    busDetailsDiv.innerHTML = '';
    activeBus = null;
}

// Event handler for stop input field
stopInput.addEventListener('focus', () => {
    updateSuggestions(stopInput, stopSuggestions, stops, stop => {
        loadBuses(stop);
    });
});

stopInput.addEventListener('input', () => {
    const stopValue = stopInput.value.trim();
    console.log('Current stop input:', stopValue);

    updateSuggestions(stopInput, stopSuggestions, stops, stop => {
        if (stop) {
            console.log('Stop selected:', stop);
            loadBuses(stop); 
        } else {
            console.error('Stop is invalid:', stop);
        }
    });
});


// Hide suggestions when losing focus
regionInput.addEventListener('blur', () => {
    setTimeout(() => {
        regionSuggestions.style.display = 'none';
    }, 150);
});

stopInput.addEventListener('blur', () => {
    setTimeout(() => {
        stopSuggestions.style.display = 'none';
    }, 150);
});

// Function: Load stops for a region
async function loadStops(region) {

    try {
        showLoading();
        const response = await fetch(`https://bus-stops-app.onrender.com/stops?region=${region}`);
        stops = await response.json();
        console.log(`Stops for region ${region} loaded:`, stops);

        stopSuggestions.innerHTML = '';
        stopInput.disabled = false;
    } catch (error) {
        console.error('Error loading stops:', error);
    } finally {
        hideLoading(); 
    }
}


// Function: Display buses
function displayBuses(buses) {
    resultsDiv.innerHTML = '<h3>Buses:</h3>';
    const busList = document.createElement('ul');

    buses.forEach(bus => {
        const listItem = document.createElement('li');
        const button = document.createElement('button');
        button.textContent = bus;
        button.className = 'btn btn-primary m-2';

        button.addEventListener('click', async () => {
            const stop = stopInput.value.trim(); // Получаем текущую остановку
            if (!stop) {
                console.error('Stop is not defined when selecting bus:', bus);
                return;
            }

            // Показываем индикатор загрузки
            showLoading();

            try {
                // Ждем выполнения всех операций внутри showSelectedBus
                await showSelectedBus(bus, stop);
            } catch (error) {
                console.error('Error during bus selection:', error);
            } finally {
                // Скрываем индикатор загрузки только после завершения
                hideLoading();
            }
        });

        listItem.appendChild(button);
        busList.appendChild(listItem);
    });

    resultsDiv.appendChild(busList);
}


// Function: Load buses for a stop
async function loadBuses(stop) {
    const region = regionInput.value.trim(); // Get the selected region


    try {
        showLoading();
        const response = await fetch(`https://bus-stops-app.onrender.com/buses?stop=${encodeURIComponent(stop)}&region=${encodeURIComponent(region)}`);
        const buses = await response.json();
        console.log(`Buses for region ${region} and stop ${stop} loaded:`, buses);
        displayBuses(buses);
    } catch (error) {
        console.error('Error loading buses:', error);
    } finally {
        hideLoading();
    }
}


// Function: Fetch bus details
async function fetchBusDetails(bus, stop) {
    if (!bus || !stop) {
        console.error("Invalid parameters for fetchBusDetails:", { bus, stop });
        return;
    }


    try {
        const response = await fetch(`https://bus-stops-app.onrender.com/bus-details?bus=${bus}&stop=${stop}`);
        const details = await response.json();

        if (details.length === 0) {
            console.log('No data found for bus:', bus, 'and stop:', stop);
            busDetailsDiv.innerHTML = `<p>No details found for bus ${bus} at stop ${stop}.</p>`;
            return;
        }

        displayBusDetails(details);
    } catch (error) {
        console.error('Error fetching bus details:', error);
    }
}

function displayBusDetails(details) {
    const uniqueDetails = [...new Map(details.map(detail => [`${detail.arrival_time}-${detail.trip_long_name}`, detail])).values()];

    const groupedDetails = uniqueDetails.reduce((groups, detail) => {
        const direction = detail.trip_long_name;
        if (!groups[direction]) {
            groups[direction] = [];
        }
        groups[direction].push(detail);
        return groups;
    }, {});

    Object.keys(groupedDetails).forEach(direction => {
        const sortedDetails = groupedDetails[direction].sort((a, b) => a.arrival_time.localeCompare(b.arrival_time));
        const directionList = sortedDetails.map(detail => `<li>${detail.arrival_time}</li>`).join('');
        busDetailsDiv.innerHTML += `<h5>Direction: ${direction}</h5><ul>${directionList}</ul>`;
    });
}

async function showSelectedBus(bus, stop) {
    if (!bus || !stop) {
        console.error("Invalid parameters for showSelectedBus:", { bus, stop });
        return;
    }

    resultsDiv.style.display = 'none'; // Скрываем список автобусов

    // Удаляем предыдущую кнопку назад, если она существует
    const backButton = document.getElementById('backButton');
    if (backButton) {
        backButton.remove();
    }

    // Создаем кнопку "Назад"
    const newBackButton = document.createElement('button');
    newBackButton.id = 'backButton';
    newBackButton.textContent = 'Назад';
    newBackButton.className = 'btn btn-danger m-3';
    newBackButton.addEventListener('click', () => {
        resultsDiv.style.display = 'block'; // Показываем список автобусов
        newBackButton.remove(); // Удаляем кнопку "Назад"
        busDetailsDiv.innerHTML = ''; // Очищаем детали автобуса
    });

    resultsDiv.parentElement.insertBefore(newBackButton, busDetailsDiv);

    // Асинхронная загрузка данных о выбранном автобусе
    await fetchBusDetails(bus, stop);
}


// Load data when the page is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadRegions();

    // Если регион уже установлен, загружаем остановки и автобусы
    if (regionInput.value.trim() !== '') {
        const initialRegion = regionInput.value.trim();
        await loadStops(initialRegion); // Загружаем остановки для региона

        if (stops.length > 0) {
            const defaultStop = stops[0]; // Устанавливаем первую остановку
            stopInput.value = defaultStop;
            stopInput.disabled = false;
            await loadBuses(defaultStop); // Загружаем автобусы для остановки
        }
    }

    // Если доступна геолокация, получаем ближайшие регион и остановку
    if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;

            try {
                const response = await fetch(`https://bus-stops-app.onrender.com/nearest?lat=${latitude}&lon=${longitude}`);
                const data = await response.json();

                // Устанавливаем регион и остановку
                regionInput.value = data.region;
                stopInput.value = data.stop;
                stopInput.disabled = false;

                // Загружаем остановки для региона
                await loadStops(data.region);

                // Загружаем автобусы для остановки
                await loadBuses(data.stop);
            } catch (error) {
                console.error('Error fetching nearest stop data:', error);
            }
        }, (error) => {
            console.error('Geolocation error:', error.message);
        });
    }
});



