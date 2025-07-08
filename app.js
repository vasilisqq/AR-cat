// Глобальные переменные
let currentModel = null;

// Функция для отображения ошибок
function showError(title, message, details) {
    const errorOverlay = document.getElementById('errorOverlay');
    const errorTitle = document.getElementById('errorTitle');
    const errorText = document.getElementById('errorText');
    const errorDetails = document.getElementById('errorDetails');
    
    errorTitle.textContent = title;
    errorText.textContent = message;
    
    if (details) {
        errorDetails.textContent = details;
        errorDetails.style.display = 'block';
    } else {
        errorDetails.style.display = 'none';
    }
    
    errorOverlay.style.display = 'flex';
    document.querySelector('.arjs-loader').style.display = 'none';
    document.getElementById('instruction').style.display = 'none';
}

// Сброс текущей модели
function resetModel() {
    window.modelPlaced = false;
    
    if (currentModel) {
        currentModel.parentNode.removeChild(currentModel);
        currentModel = null;
    }
    
    document.getElementById('instruction').style.display = 'block';
}

// Регистрация компонента для обработки жестов
AFRAME.registerComponent('gesture-detector', {
    init: function() {
        this.el.addEventListener('click', (e) => {
            if (!window.modelPlaced) {
                try {
                    this.placeModel(e); // Важно: передаем событие
                } catch (error) {
                    showError(
                        'Ошибка размещения модели', 
                        'Не удалось разместить модель. Убедитесь, что:\n1. Плоскость обнаружена\n2. Модель загружена', 
                        error.message
                    );
                }
            }
        });
    },
    
    placeModel: function(e) {
        // Получаем точку пересечения луча от касания с плоскостью
        const intersections = e.detail.intersections;
        if (!intersections || intersections.length === 0) {
            throw new Error('Не удалось определить точку касания. Убедитесь, что вы тапнули по обнаруженной плоскости.');
        }

        // Берем первую точку пересечения
        const touchPoint = intersections[0].point;
        
        // Создаем модель в точке касания
        currentModel = document.createElement('a-entity');
        currentModel.setAttribute('gltf-model', '#defaultModel');
        currentModel.setAttribute('scale', '0.5 0.5 0.5');
        currentModel.setAttribute('position', touchPoint);
        currentModel.setAttribute('rotation', '0 0 0');
        currentModel.setAttribute('animation-mixer', 'clip: Appear; loop: once');
        currentModel.setAttribute('shadow', 'receive: true');
        
        // Обработка ошибок загрузки модели
        currentModel.addEventListener('model-error', function() {
            showError(
                'Ошибка загрузки модели', 
                'Не удалось загрузить 3D-модель. Возможные причины:\n1. Неправильный путь к модели\n2. Формат модели не поддерживается\n3. Проблемы с сервером', 
                'Проверьте консоль разработчика для деталей'
            );
        });
        
        // Добавляем модель в сцену
        this.el.appendChild(currentModel);
        
        // Скрываем инструкцию
        document.getElementById('instruction').style.display = 'none';
        
        // Флаг что модель размещена
        window.modelPlaced = true;
        
        // Запускаем дополнительную анимацию через 2 секунды
        setTimeout(() => {
            try {
                currentModel.setAttribute('animation-mixer', 'clip: Idle; loop: repeat');
            } catch (error) {
                showError(
                    'Ошибка анимации', 
                    'Не удалось запустить анимацию модели. Проверьте:\n1. Наличие анимаций в модели\n2. Правильные имена анимаций', 
                    error.message
                );
            }
        }, 2000);
    }
});

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    // Глобальная обработка ошибок
    window.addEventListener('error', function(event) {
        showError(
            'Непредвиденная ошибка', 
            'В работе приложения произошла ошибка. Попробуйте перезагрузить страницу.', 
            `Ошибка: ${event.message}\nФайл: ${event.filename}\nСтрока: ${event.lineno}`
        );
        console.error(event.error);
    });
    const scene = document.querySelector('a-scene');
     scene.addEventListener('arjs-video-error', function() {
        showError(
            'Ошибка доступа к камере',
            'Не удалось получить доступ к камере. Пожалуйста:\n1. Разрешите доступ к камере\n2. Обновите браузер\n3. Перезагрузите страницу',
            ''
        );
    });
    
    // Обработка ошибок в промисах
    window.addEventListener('unhandledrejection', function(event) {
        const reason = event.reason || {};
        showError(
            'Ошибка загрузки', 
            'Проблема при загрузке ресурсов. Проверьте подключение к интернету.', 
            reason.message || 'Неизвестная ошибка promise'
        );
        console.error(event.reason);
    });
    
    // Скрываем лоадер после загрузки сцены
    document.querySelector('a-scene').addEventListener('loaded', function() {
        document.querySelector('.arjs-loader').style.display = 'none';
        
        // Проверяем поддержку AR
        setTimeout(() => {
            if (!AFRAME.systems.arjs || !AFRAME.systems.arjs.isWebXRCameraActive) {
                showError(
                    'AR не поддерживается', 
                    'Ваше устройство или браузер не поддерживают AR-функции.\nПопробуйте использовать:\n- Safari на iPhone (iOS 13+)\n- Chrome на Android (9.0+)', 
                    'Проверьте поддержку WebXR: https://caniuse.com/webxr'
                );
            }
        }, 2000);
    });
    
    // Таймер для проверки загрузки
    setTimeout(() => {
        if (document.querySelector('.arjs-loader').style.display !== 'none') {
            showError(
                'Проблема с загрузкой', 
                'AR-среда не загрузилась в течение ожидаемого времени. Возможные причины:\n1. Медленное интернет-соединение\n2. Браузер не поддерживает WebGL\n3. Нет разрешения на доступ к камере', 
                'Проверьте консоль разработчика для деталей'
            );
        }
    }, 15000); // 15 секунд
    
    // Проверка поддержки WebGL
    if (!AFRAME.utils.device.checkWebGLSupport()) {
        showError(
            'WebGL не поддерживается', 
            'Ваш браузер не поддерживает необходимые технологии для работы AR.\nПопробуйте обновить браузер или использовать другое устройство.', 
            'Требуется поддержка WebGL 2.0'
        );
    }
    
    // Проверка поддержки getUserMedia (доступ к камере)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showError(
            'Доступ к камере невозможен', 
            'Ваш браузер не поддерживает доступ к камере или эта функция отключена.\nПроверьте настройки браузера.', 
            'Требуется поддержка MediaDevices API'
        );
    }
});