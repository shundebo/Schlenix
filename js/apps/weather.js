// Schlenix - 天气应用

class WeatherApp {
    constructor() {
        this.instances = new Map();
        this.apiKey = '52bb4e5949c347eda690152ff7952d50';
        this.apiBase = 'https://devapi.qweather.com/v7';
    }

    open() {
        const windowId = windowManager.createWindow({
            title: '天气',
            icon: '🌤️',
            width: 450,
            height: 500,
            content: this.getContent()
        });

        this.instances.set(windowId, {
            currentCity: '北京',
            locationId: '101010100',
            weatherData: null
        });

        this.attachEvents(windowId);
        this.loadWeather(windowId, '北京');
    }

    getContent() {
        return `
            <div class="weather-header">
                <input type="text" class="weather-search" placeholder="搜索城市..." value="北京">
                <button class="weather-search-btn">🔍</button>
            </div>
            <div class="weather-content">
                <div class="weather-loading">正在加载天气数据...</div>
            </div>
        `;
    }

    attachEvents(windowId) {
        const content = windowManager.getWindowContent(windowId);
        if (!content) return;

        const searchInput = content.querySelector('.weather-search');
        const searchBtn = content.querySelector('.weather-search-btn');

        searchBtn.addEventListener('click', () => {
            const city = searchInput.value.trim();
            if (city) {
                this.loadWeather(windowId, city);
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const city = searchInput.value.trim();
                if (city) {
                    this.loadWeather(windowId, city);
                }
            }
        });

        const window = windowManager.windows.get(windowId);
        if (window && window.element) {
            const closeBtn = window.element.querySelector('.window-control-btn.close');
            if (closeBtn) {
                const originalClose = closeBtn.onclick;
                closeBtn.onclick = () => {
                    this.instances.delete(windowId);
                    if (originalClose) originalClose();
                };
            }
        }
    }

    async loadWeather(windowId, city) {
        const content = windowManager.getWindowContent(windowId);
        const instance = this.instances.get(windowId);
        if (!content || !instance) return;

        const weatherContent = content.querySelector('.weather-content');
        weatherContent.innerHTML = '<div class="weather-loading">正在加载天气数据...</div>';

        try {
            // 1. 先获取城市 Location ID
            const locationData = await this.getCityLocation(city);
            if (!locationData || locationData.code !== '200') {
                throw new Error('城市不存在或查询失败');
            }

            const location = locationData.location[0];
            instance.locationId = location.id;
            instance.currentCity = location.name;

            // 2. 获取实时天气
            const nowWeather = await this.getNowWeather(location.id);
            
            // 3. 获取7天预报
            const forecast = await this.get7DayForecast(location.id);

            // 4. 获取空气质量
            const airQuality = await this.getAirQuality(location.id);

            // 合并数据
            const weatherData = {
                city: location.name,
                adm1: location.adm1,
                adm2: location.adm2,
                now: nowWeather.now,
                forecast: forecast.daily,
                air: airQuality.now
            };

            instance.weatherData = weatherData;
            weatherContent.innerHTML = this.renderWeather(weatherData);
            notify.success('成功', `已加载 ${location.name} 的天气数据`);

        } catch (error) {
            console.error('Weather API Error:', error);
            weatherContent.innerHTML = `
                <div class="weather-error">
                    <div class="error-icon">❌</div>
                    <div class="error-message">加载失败: ${error.message}</div>
                    <div class="error-hint">请检查城市名称或稍后重试</div>
                </div>
            `;
            notify.error('错误', '天气数据加载失败');
        }
    }

    async getCityLocation(city) {
        const url = `${this.apiBase}/city/lookup?location=${encodeURIComponent(city)}&key=${this.apiKey}`;
        const response = await fetch(url);
        return await response.json();
    }

    async getNowWeather(locationId) {
        const url = `${this.apiBase}/weather/now?location=${locationId}&key=${this.apiKey}`;
        const response = await fetch(url);
        return await response.json();
    }

    async get7DayForecast(locationId) {
        const url = `${this.apiBase}/weather/7d?location=${locationId}&key=${this.apiKey}`;
        const response = await fetch(url);
        return await response.json();
    }

    async getAirQuality(locationId) {
        const url = `${this.apiBase}/air/now?location=${locationId}&key=${this.apiKey}`;
        const response = await fetch(url);
        return await response.json();
    }

    renderWeather(data) {
        const weatherIcon = this.getWeatherIcon(data.now.icon);
        const aqiLevel = this.getAQILevel(parseInt(data.air?.aqi || 0));

        return `
            <div class="weather-current">
                <div class="weather-city">${data.city}</div>
                <div class="weather-location">${data.adm1} · ${data.adm2}</div>
                <div class="weather-icon">${weatherIcon}</div>
                <div class="weather-temp">${data.now.temp}°C</div>
                <div class="weather-condition">${data.now.text}</div>
                <div class="weather-feels-like">体感温度 ${data.now.feelsLike}°C</div>
            </div>
            <div class="weather-details">
                <div class="weather-detail-item">
                    <span class="detail-label">湿度</span>
                    <span class="detail-value">${data.now.humidity}%</span>
                </div>
                <div class="weather-detail-item">
                    <span class="detail-label">风力</span>
                    <span class="detail-value">${data.now.windScale}级</span>
                </div>
                <div class="weather-detail-item">
                    <span class="detail-label">风向</span>
                    <span class="detail-value">${data.now.windDir}</span>
                </div>
                <div class="weather-detail-item">
                    <span class="detail-label">气压</span>
                    <span class="detail-value">${data.now.pressure}hPa</span>
                </div>
                <div class="weather-detail-item">
                    <span class="detail-label">能见度</span>
                    <span class="detail-value">${data.now.vis}km</span>
                </div>
                <div class="weather-detail-item">
                    <span class="detail-label">空气质量</span>
                    <span class="detail-value aqi-${aqiLevel}">${data.air?.aqi || 'N/A'}</span>
                </div>
            </div>
            <div class="weather-forecast">
                <div class="forecast-title">7天预报</div>
                ${data.forecast.map(day => {
                    const date = new Date(day.fxDate);
                    const dayName = this.getDayName(date);
                    return `
                        <div class="forecast-item">
                            <span class="forecast-day">${dayName}</span>
                            <span class="forecast-icon">${this.getWeatherIcon(day.iconDay)}</span>
                            <span class="forecast-text">${day.textDay}</span>
                            <span class="forecast-temp">${day.tempMin}° ~ ${day.tempMax}°</span>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="weather-update">
                更新时间: ${new Date(data.now.obsTime).toLocaleString('zh-CN')}
            </div>
        `;
    }

    getWeatherIcon(iconCode) {
        const iconMap = {
            '100': '☀️', // 晴
            '101': '⛅', // 多云
            '102': '☁️', // 少云
            '103': '☁️', // 晴间多云
            '104': '☁️', // 阴
            '150': '🌙', // 晴（夜间）
            '151': '☁️', // 多云（夜间）
            '300': '🌦️', // 阵雨
            '301': '🌧️', // 强阵雨
            '302': '⛈️', // 雷阵雨
            '303': '⛈️', // 强雷阵雨
            '304': '⛈️', // 雷阵雨伴有冰雹
            '305': '🌧️', // 小雨
            '306': '🌧️', // 中雨
            '307': '🌧️', // 大雨
            '308': '🌧️', // 极端降雨
            '309': '🌧️', // 毛毛雨
            '310': '🌧️', // 暴雨
            '311': '🌧️', // 大暴雨
            '312': '🌧️', // 特大暴雨
            '313': '🌧️', // 冻雨
            '314': '🌧️', // 小到中雨
            '315': '🌧️', // 中到大雨
            '316': '🌧️', // 大到暴雨
            '317': '🌧️', // 暴雨到大暴雨
            '318': '🌧️', // 大暴雨到特大暴雨
            '399': '🌧️', // 雨
            '400': '🌨️', // 小雪
            '401': '🌨️', // 中雪
            '402': '❄️', // 大雪
            '403': '❄️', // 暴雪
            '404': '🌨️', // 雨夹雪
            '405': '🌨️', // 雨雪天气
            '406': '🌨️', // 阵雨夹雪
            '407': '🌨️', // 阵雪
            '408': '🌨️', // 小到中雪
            '409': '🌨️', // 中到大雪
            '410': '❄️', // 大到暴雪
            '499': '❄️', // 雪
            '500': '🌫️', // 薄雾
            '501': '🌫️', // 雾
            '502': '🌫️', // 霾
            '503': '💨', // 扬沙
            '504': '💨', // 浮尘
            '507': '💨', // 沙尘暴
            '508': '💨', // 强沙尘暴
            '509': '🌫️', // 浓雾
            '510': '🌫️', // 强浓雾
            '511': '🌫️', // 中度霾
            '512': '🌫️', // 重度霾
            '513': '🌫️', // 严重霾
            '514': '🌫️', // 大雾
            '515': '🌫️', // 特强浓雾
            '900': '🌡️', // 热
            '901': '🥶', // 冷
            '999': '❓'  // 未知
        };
        return iconMap[iconCode] || '🌤️';
    }

    getAQILevel(aqi) {
        if (aqi <= 50) return 'good';
        if (aqi <= 100) return 'moderate';
        if (aqi <= 150) return 'unhealthy-sensitive';
        if (aqi <= 200) return 'unhealthy';
        if (aqi <= 300) return 'very-unhealthy';
        return 'hazardous';
    }

    getDayName(date) {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return '今天';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return '明天';
        } else {
            const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return days[date.getDay()];
        }
    }
}

// 注册应用
if (!window.apps) window.apps = {};
window.apps['weather'] = new WeatherApp();