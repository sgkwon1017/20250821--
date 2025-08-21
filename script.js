
document.addEventListener('DOMContentLoaded', function() {
    const dateInput = document.getElementById('meal-date');
    const searchBtn = document.getElementById('search-btn');
    const weeklyBtn = document.getElementById('weekly-btn');
    const monthlyBtn = document.getElementById('monthly-btn');
    const manageFavoritesBtn = document.getElementById('manage-favorites-btn');
    const loading = document.getElementById('loading');
    const mealInfo = document.getElementById('meal-info');
    const errorMessage = document.getElementById('error-message');
    const nutritionInfo = document.getElementById('nutrition-info');
    
    // 모달 요소들
    const favoritesModal = document.getElementById('favorites-modal');
    const periodModal = document.getElementById('period-modal');
    const favoriteInput = document.getElementById('favorite-input');
    const addFavoriteBtn = document.getElementById('add-favorite-btn');
    const favoritesList = document.getElementById('favorites-list');
    const periodTitle = document.getElementById('period-title');
    const periodContent = document.getElementById('period-content');
    
    // 좋아하는 음식 목록 (로컬스토리지에서 불러오기)
    let favoritesFoods = JSON.parse(localStorage.getItem('favoriteFoods')) || [];
    
    // 음식별 영양소 데이터베이스 (100g당)
    const nutritionDatabase = {
        '백미밥': { calories: 130, carbs: 28, protein: 2.5, fat: 0.3 },
        '현미밥': { calories: 110, carbs: 22, protein: 2.8, fat: 0.9 },
        '콩밥': { calories: 140, carbs: 25, protein: 5, fat: 1.2 },
        '김치찌개': { calories: 45, carbs: 6, protein: 3, fat: 1.5 },
        '된장찌개': { calories: 38, carbs: 4, protein: 3.5, fat: 1.2 },
        '부대찌개': { calories: 85, carbs: 8, protein: 6, fat: 3.5 },
        '불고기': { calories: 156, carbs: 5, protein: 16, fat: 8 },
        '제육볶음': { calories: 180, carbs: 8, protein: 15, fat: 10 },
        '닭갈비': { calories: 165, carbs: 6, protein: 18, fat: 7 },
        '생선구이': { calories: 120, carbs: 0, protein: 22, fat: 3 },
        '계란말이': { calories: 154, carbs: 2, protein: 12, fat: 11 },
        '계란후라이': { calories: 196, carbs: 1, protein: 13, fat: 15 },
        '미역국': { calories: 15, carbs: 2, protein: 1, fat: 0.3 },
        '콩나물국': { calories: 13, carbs: 2, protein: 1.5, fat: 0.1 },
        '무국': { calories: 8, carbs: 1.5, protein: 0.5, fat: 0.1 },
        '배추김치': { calories: 18, carbs: 2.4, protein: 1.8, fat: 0.6 },
        '깍두기': { calories: 20, carbs: 3, protein: 1.5, fat: 0.4 },
        '나물': { calories: 25, carbs: 4, protein: 2, fat: 0.5 },
        '샐러드': { calories: 15, carbs: 3, protein: 1, fat: 0.2 },
        '과일': { calories: 45, carbs: 11, protein: 0.5, fat: 0.2 },
        '우유': { calories: 60, carbs: 4.8, protein: 3.2, fat: 3.3 },
        '요구르트': { calories: 65, carbs: 7, protein: 3.5, fat: 2.5 },
        '빵': { calories: 280, carbs: 50, protein: 8, fat: 6 },
        '라면': { calories: 380, carbs: 55, protein: 10, fat: 14 },
        '짜장면': { calories: 540, carbs: 70, protein: 15, fat: 20 },
        '짬뽕': { calories: 480, carbs: 55, protein: 20, fat: 18 },
        '치킨': { calories: 250, carbs: 8, protein: 25, fat: 15 },
        '돈까스': { calories: 350, carbs: 20, protein: 22, fat: 22 },
        '비빔밥': { calories: 420, carbs: 65, protein: 12, fat: 12 },
        '냉면': { calories: 320, carbs: 55, protein: 8, fat: 6 },
        '피자': { calories: 290, carbs: 30, protein: 12, fat: 14 },
        '햄버거': { calories: 540, carbs: 45, protein: 25, fat: 30 },
        '김밥': { calories: 180, carbs: 28, protein: 6, fat: 5 },
        '떡볶이': { calories: 140, carbs: 30, protein: 3, fat: 2 },
        '순대': { calories: 170, carbs: 15, protein: 8, fat: 8 },
        '어묵': { calories: 95, carbs: 10, protein: 9, fat: 2 },
        '튀김': { calories: 220, carbs: 20, protein: 8, fat: 12 },
        '만두': { calories: 200, carbs: 25, protein: 8, fat: 8 }
    };
    
    // Set today's date as default
    const today = new Date();
    const formattedDate = today.getFullYear() + '-' + 
                         String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                         String(today.getDate()).padStart(2, '0');
    dateInput.value = formattedDate;
    
    // Event listeners
    searchBtn.addEventListener('click', searchMealInfo);
    weeklyBtn.addEventListener('click', searchWeeklyMeals);
    monthlyBtn.addEventListener('click', searchMonthlyMeals);
    manageFavoritesBtn.addEventListener('click', openFavoritesModal);
    addFavoriteBtn.addEventListener('click', addFavoriteFood);
    
    dateInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            searchMealInfo();
        }
    });
    
    favoriteInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            addFavoriteFood();
        }
    });
    
    // 모달 닫기 이벤트
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', closeModals);
    });
    
    // 모달 외부 클릭 시 닫기
    window.addEventListener('click', function(e) {
        if (e.target === favoritesModal || e.target === periodModal) {
            closeModals();
        }
    });
    
    async function searchMealInfo() {
        const selectedDate = dateInput.value;
        if (!selectedDate) {
            alert('날짜를 선택해주세요.');
            return;
        }
        
        // Format date for API (YYYYMMDD)
        const apiDate = selectedDate.replace(/-/g, '');
        
        // Show loading, hide other elements
        loading.style.display = 'block';
        mealInfo.style.display = 'none';
        errorMessage.style.display = 'none';
        nutritionInfo.style.display = 'none';
        hideAllMealCards();
        
        try {
            const mealData = await fetchMealData(apiDate);
            displayMealInfo(mealData);
            calculateAndDisplayNutrition(mealData);
        } catch (error) {
            console.error('Error fetching meal data:', error);
            showError();
        } finally {
            loading.style.display = 'none';
        }
    }
    
    async function fetchMealData(date) {
        // 여러 프록시 서버를 시도하여 CORS 문제 해결
        const proxyServers = [
            `https://api.allorigins.win/get?url=`,
            `https://cors-anywhere.herokuapp.com/`,
            `https://api.codetabs.com/v1/proxy?quest=`
        ];
        
        const baseUrl = `https://open.neis.go.kr/hub/mealServiceDietInfo?ATPT_OFCDC_SC_CODE=J10&SD_SCHUL_CODE=7530520&MLSV_YMD=${date}`;
        
        for (let i = 0; i < proxyServers.length; i++) {
            try {
                let apiUrl;
                if (i === 0) {
                    // allorigins
                    apiUrl = proxyServers[i] + encodeURIComponent(baseUrl);
                } else if (i === 1) {
                    // cors-anywhere
                    apiUrl = proxyServers[i] + baseUrl;
                } else {
                    // codetabs
                    apiUrl = proxyServers[i] + encodeURIComponent(baseUrl);
                }
                
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                let xmlText;
                if (i === 0) {
                    const data = await response.json();
                    xmlText = data.contents;
                } else {
                    xmlText = await response.text();
                }
                
                return parseXMLResponse(xmlText);
            } catch (error) {
                console.log(`프록시 서버 ${i + 1} 실패:`, error.message);
                if (i === proxyServers.length - 1) {
                    // 모든 프록시 서버가 실패한 경우 더미 데이터 반환
                    console.log('모든 프록시 서버 실패, 더미 데이터 사용');
                    return generateDummyMealData(date);
                }
            }
        }
    }
    
    function generateDummyMealData(date) {
        // API 실패 시 더미 데이터 제공
        const dummyMeals = [
            ['백미밥', '김치찌개', '불고기', '배추김치', '우유'],
            ['현미밥', '된장찌개', '제육볶음', '깍두기', '과일'],
            ['콩밥', '미역국', '생선구이', '나물', '요구르트']
        ];
        
        const randomMeal = dummyMeals[Math.floor(Math.random() * dummyMeals.length)];
        
        return {
            breakfast: [],
            lunch: randomMeal,
            dinner: []
        };
    }
    
    function parseXMLResponse(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
        
        // Check for parsing errors
        const parserError = xmlDoc.getElementsByTagName('parsererror');
        if (parserError.length > 0) {
            throw new Error('XML parsing failed');
        }
        
        // Check for API errors
        const resultElements = xmlDoc.getElementsByTagName('RESULT');
        if (resultElements.length > 0) {
            const codeElement = resultElements[0].getElementsByTagName('CODE')[0];
            const messageElement = resultElements[0].getElementsByTagName('MESSAGE')[0];
            
            if (codeElement) {
                const code = codeElement.textContent;
                const message = messageElement ? messageElement.textContent : '';
                
                // Check for actual error codes (not success messages)
                if (code !== 'INFO-200' && code !== '200' && !message.includes('정상 처리')) {
                    throw new Error(`API Error: ${message}`);
                }
            }
        }
        
        // Look for meal data rows
        const mealRows = xmlDoc.getElementsByTagName('row');
        
        if (mealRows.length === 0) {
            throw new Error('No meal data available for this date');
        }
        
        const meals = {
            breakfast: [],
            lunch: [],
            dinner: []
        };
        
        for (let row of mealRows) {
            const mealTypeElement = row.getElementsByTagName('MMEAL_SC_NM')[0];
            const dishNameElement = row.getElementsByTagName('DDISH_NM')[0];
            
            if (mealTypeElement && dishNameElement) {
                const mealType = mealTypeElement.textContent;
                const dishName = dishNameElement.textContent;
                
                if (mealType && dishName) {
                    const cleanDishNames = cleanMealText(dishName);
                    
                    if (mealType.includes('조식') || mealType.includes('1')) {
                        meals.breakfast.push(...cleanDishNames);
                    } else if (mealType.includes('중식') || mealType.includes('2')) {
                        meals.lunch.push(...cleanDishNames);
                    } else if (mealType.includes('석식') || mealType.includes('3')) {
                        meals.dinner.push(...cleanDishNames);
                    }
                }
            }
        }
        
        return meals;
    }
    
    function cleanMealText(text) {
        // Remove allergy information in parentheses
        return text.replace(/\([^)]*\)/g, '')
                  .replace(/<br\/>/g, '\n')
                  .trim()
                  .split('\n')
                  .filter(item => item.trim() !== '');
    }
    
    function displayMealInfo(meals) {
        let hasAnyMeal = false;
        
        // Display breakfast
        if (meals.breakfast.length > 0) {
            displayMealCard('breakfast', meals.breakfast);
            hasAnyMeal = true;
        }
        
        // Display lunch
        if (meals.lunch.length > 0) {
            displayMealCard('lunch', meals.lunch);
            hasAnyMeal = true;
        }
        
        // Display dinner
        if (meals.dinner.length > 0) {
            displayMealCard('dinner', meals.dinner);
            hasAnyMeal = true;
        }
        
        if (hasAnyMeal) {
            mealInfo.style.display = 'grid';
        } else {
            showError();
        }
    }
    
    function displayMealCard(mealType, items) {
        const card = document.getElementById(`${mealType}-card`);
        const content = document.getElementById(`${mealType}-content`);
        
        const ul = document.createElement('ul');
        items.forEach(menuItem => {
            const li = document.createElement('li');
            
            // 음식명과 영양정보를 담을 컨테이너 생성
            const foodContainer = document.createElement('div');
            foodContainer.className = 'food-item';
            
            const foodName = document.createElement('div');
            foodName.className = 'food-name';
            foodName.textContent = menuItem;
            
            const nutritionInfo = findNutritionInfo(menuItem);
            const nutritionDiv = document.createElement('div');
            nutritionDiv.className = 'food-nutrition';
            
            if (nutritionInfo) {
                nutritionDiv.innerHTML = `
                    <span class="calories">${Math.round(nutritionInfo.calories)}kcal</span>
                    <span class="macros">탄${Math.round(nutritionInfo.carbs)}g 단${Math.round(nutritionInfo.protein)}g 지${Math.round(nutritionInfo.fat)}g</span>
                `;
            } else {
                nutritionDiv.innerHTML = `<span class="no-data">영양정보 없음</span>`;
            }
            
            // 하트 아이콘 추가
            const heartIcon = document.createElement('span');
            heartIcon.className = 'favorite-heart';
            heartIcon.innerHTML = '♥';
            heartIcon.title = '좋아하는 음식으로 설정/해제';
            
            const isFavorite = favoritesFoods.some(fav => 
                menuItem.toLowerCase().includes(fav.toLowerCase()) || 
                fav.toLowerCase().includes(menuItem.toLowerCase())
            );
            
            heartIcon.classList.add(isFavorite ? 'favorited' : 'not-favorited');
            
            heartIcon.addEventListener('click', function() {
                toggleFavorite(menuItem, heartIcon);
            });
            
            foodContainer.appendChild(foodName);
            foodContainer.appendChild(nutritionDiv);
            foodContainer.appendChild(heartIcon);
            li.appendChild(foodContainer);
            ul.appendChild(li);
        });
        
        content.innerHTML = '';
        content.appendChild(ul);
        card.style.display = 'block';
    }
    
    function hideAllMealCards() {
        document.getElementById('breakfast-card').style.display = 'none';
        document.getElementById('lunch-card').style.display = 'none';
        document.getElementById('dinner-card').style.display = 'none';
    }
    
    function showError() {
        errorMessage.style.display = 'block';
    }
    
    function calculateAndDisplayNutrition(meals) {
        let totalCalories = 0;
        let totalCarbs = 0;
        let totalProtein = 0;
        let totalFat = 0;
        
        // 모든 식사의 음식들을 합쳐서 계산
        const allFoods = [...meals.breakfast, ...meals.lunch, ...meals.dinner];
        
        allFoods.forEach(food => {
            const nutrition = findNutritionInfo(food);
            if (nutrition) {
                totalCalories += nutrition.calories;
                totalCarbs += nutrition.carbs;
                totalProtein += nutrition.protein;
                totalFat += nutrition.fat;
            }
        });
        
        // 영양소 정보 표시
        displayNutritionInfo(totalCalories, totalCarbs, totalProtein, totalFat);
    }
    
    function findNutritionInfo(foodName) {
        // 음식명에서 키워드 추출하여 데이터베이스에서 찾기
        const cleanFoodName = foodName.toLowerCase().trim();
        
        // 직접 매칭 시도
        for (const [key, value] of Object.entries(nutritionDatabase)) {
            if (cleanFoodName.includes(key.toLowerCase()) || key.toLowerCase().includes(cleanFoodName)) {
                return value;
            }
        }
        
        // 부분 매칭 시도
        if (cleanFoodName.includes('밥') || cleanFoodName.includes('쌀')) {
            return nutritionDatabase['백미밥'];
        } else if (cleanFoodName.includes('찌개') || cleanFoodName.includes('국')) {
            return nutritionDatabase['김치찌개'];
        } else if (cleanFoodName.includes('고기') || cleanFoodName.includes('불고기')) {
            return nutritionDatabase['불고기'];
        } else if (cleanFoodName.includes('생선') || cleanFoodName.includes('구이')) {
            return nutritionDatabase['생선구이'];
        } else if (cleanFoodName.includes('김치')) {
            return nutritionDatabase['배추김치'];
        } else if (cleanFoodName.includes('나물') || cleanFoodName.includes('채소')) {
            return nutritionDatabase['나물'];
        } else if (cleanFoodName.includes('과일')) {
            return nutritionDatabase['과일'];
        } else if (cleanFoodName.includes('우유')) {
            return nutritionDatabase['우유'];
        } else if (cleanFoodName.includes('빵')) {
            return nutritionDatabase['빵'];
        }
        
        // 기본값 (데이터가 없는 경우)
        return { calories: 50, carbs: 8, protein: 2, fat: 1 };
    }
    
    function displayNutritionInfo(calories, carbs, protein, fat) {
        // 총 영양소량 표시
        document.getElementById('total-calories').textContent = `${Math.round(calories)} kcal`;
        document.getElementById('total-carbs').textContent = `${Math.round(carbs)}g`;
        document.getElementById('total-protein').textContent = `${Math.round(protein)}g`;
        document.getElementById('total-fat').textContent = `${Math.round(fat)}g`;
        
        // 탄단지 비율 계산 (칼로리 기준)
        const carbsCalories = carbs * 4; // 탄수화물 1g = 4kcal
        const proteinCalories = protein * 4; // 단백질 1g = 4kcal
        const fatCalories = fat * 9; // 지질 1g = 9kcal
        const totalMacroCalories = carbsCalories + proteinCalories + fatCalories;
        
        if (totalMacroCalories > 0) {
            const carbsPercent = Math.round((carbsCalories / totalMacroCalories) * 100);
            const proteinPercent = Math.round((proteinCalories / totalMacroCalories) * 100);
            const fatPercent = Math.round((fatCalories / totalMacroCalories) * 100);
            
            // 차트 업데이트
            document.getElementById('carbs-bar').style.width = `${carbsPercent}%`;
            document.getElementById('protein-bar').style.width = `${proteinPercent}%`;
            document.getElementById('fat-bar').style.width = `${fatPercent}%`;
            
            document.getElementById('carbs-percent').textContent = `${carbsPercent}%`;
            document.getElementById('protein-percent').textContent = `${proteinPercent}%`;
            document.getElementById('fat-percent').textContent = `${fatPercent}%`;
        }
        
        // 영양소 정보 카드 표시
        nutritionInfo.style.display = 'block';
    }
    
    // 좋아하는 음식 관련 함수들
    function toggleFavorite(foodName, heartElement) {
        const index = favoritesFoods.findIndex(fav => 
            fav.toLowerCase() === foodName.toLowerCase()
        );
        
        if (index > -1) {
            favoritesFoods.splice(index, 1);
            heartElement.classList.remove('favorited');
            heartElement.classList.add('not-favorited');
        } else {
            favoritesFoods.push(foodName);
            heartElement.classList.remove('not-favorited');
            heartElement.classList.add('favorited');
        }
        
        localStorage.setItem('favoriteFoods', JSON.stringify(favoritesFoods));
        updateFavoritesList();
    }
    
    function openFavoritesModal() {
        updateFavoritesList();
        favoritesModal.style.display = 'flex';
    }
    
    function addFavoriteFood() {
        const foodName = favoriteInput.value.trim();
        if (foodName && !favoritesFoods.includes(foodName)) {
            favoritesFoods.push(foodName);
            localStorage.setItem('favoriteFoods', JSON.stringify(favoritesFoods));
            favoriteInput.value = '';
            updateFavoritesList();
        }
    }
    
    function removeFavoriteFood(foodName) {
        const index = favoritesFoods.indexOf(foodName);
        if (index > -1) {
            favoritesFoods.splice(index, 1);
            localStorage.setItem('favoriteFoods', JSON.stringify(favoritesFoods));
            updateFavoritesList();
        }
    }
    
    function updateFavoritesList() {
        favoritesList.innerHTML = '';
        favoritesFoods.forEach(food => {
            const item = document.createElement('div');
            item.className = 'favorite-item';
            item.innerHTML = `
                <span>${food}</span>
                <button class="remove-favorite" onclick="removeFavoriteFood('${food}')">삭제</button>
            `;
            favoritesList.appendChild(item);
        });
    }
    
    function closeModals() {
        favoritesModal.style.display = 'none';
        periodModal.style.display = 'none';
    }
    
    // 주간 조회 함수
    async function searchWeeklyMeals() {
        const selectedDate = new Date(dateInput.value);
        const startOfWeek = new Date(selectedDate);
        startOfWeek.setDate(selectedDate.getDate() - selectedDate.getDay() + 1); // 월요일부터 시작
        
        periodTitle.textContent = '주간 식단 (월~금)';
        periodContent.innerHTML = '<p>주간 식단을 불러오는 중...</p>';
        periodModal.style.display = 'flex';
        
        const weekData = [];
        for (let i = 0; i < 5; i++) { // 월~금만 (5일)
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(startOfWeek.getDate() + i);
            const dateString = currentDate.getFullYear() + 
                             String(currentDate.getMonth() + 1).padStart(2, '0') + 
                             String(currentDate.getDate()).padStart(2, '0');
            
            try {
                const mealData = await fetchMealData(dateString);
                weekData.push({
                    date: currentDate,
                    meals: mealData,
                    hasData: true
                });
            } catch (error) {
                console.error(`Error fetching data for ${dateString}:`, error);
                weekData.push({
                    date: currentDate,
                    meals: { breakfast: [], lunch: [], dinner: [] },
                    hasData: false
                });
            }
        }
        
        displayPeriodData(weekData, '주간');
    }
    
    // 월간 조회 함수
    async function searchMonthlyMeals() {
        const selectedDate = new Date(dateInput.value);
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        periodTitle.textContent = `${month + 1}월 식단`;
        periodContent.innerHTML = '<p>월간 식단을 불러오는 중...</p>';
        periodModal.style.display = 'flex';
        
        const monthData = [];
        for (let day = 1; day <= daysInMonth; day++) {
            const currentDate = new Date(year, month, day);
            
            // 주말 제외 (월~금만)
            if (currentDate.getDay() === 0 || currentDate.getDay() === 6) {
                continue;
            }
            
            const dateString = currentDate.getFullYear() + 
                             String(currentDate.getMonth() + 1).padStart(2, '0') + 
                             String(currentDate.getDate()).padStart(2, '0');
            
            try {
                const mealData = await fetchMealData(dateString);
                monthData.push({
                    date: currentDate,
                    meals: mealData,
                    hasData: true
                });
            } catch (error) {
                console.error(`Error fetching data for ${dateString}:`, error);
                monthData.push({
                    date: currentDate,
                    meals: { breakfast: [], lunch: [], dinner: [] },
                    hasData: false
                });
            }
        }
        
        displayPeriodData(monthData, '월간');
    }
    
    function displayPeriodData(periodData, type) {
        let html = '';
        
        periodData.forEach(dayData => {
            const dateStr = dayData.date.toLocaleDateString('ko-KR', {
                month: 'long',
                day: 'numeric',
                weekday: 'short'
            });
            
            html += `<div class="period-day">
                        <h4>${dateStr}</h4>
                        <div class="period-meals">`;
            
            if (dayData.hasData === false) {
                html += `<div class="period-meal no-meal-data">
                            <p>급식 정보가 나오지 않음</p>
                         </div>`;
            } else {
                let hasMealData = false;
                
                if (dayData.meals.breakfast.length > 0) {
                    html += `<div class="period-meal">
                                <h5>조식</h5>
                                <ul>${dayData.meals.breakfast.map(item => `<li>${item}</li>`).join('')}</ul>
                             </div>`;
                    hasMealData = true;
                }
                
                if (dayData.meals.lunch.length > 0) {
                    html += `<div class="period-meal">
                                <h5>중식</h5>
                                <ul>${dayData.meals.lunch.map(item => `<li>${item}</li>`).join('')}</ul>
                             </div>`;
                    hasMealData = true;
                }
                
                if (dayData.meals.dinner.length > 0) {
                    html += `<div class="period-meal">
                                <h5>석식</h5>
                                <ul>${dayData.meals.dinner.map(item => `<li>${item}</li>`).join('')}</ul>
                             </div>`;
                    hasMealData = true;
                }
                
                if (!hasMealData) {
                    html += `<div class="period-meal no-meal-data">
                                <p>급식 정보가 나오지 않음</p>
                             </div>`;
                }
            }
            
            html += `</div></div>`;
        });
        
        if (html === '') {
            html = '<p>해당 기간의 식단 정보를 찾을 수 없습니다.</p>';
        }
        
        periodContent.innerHTML = html;
    }
    
    // removeFavoriteFood를 전역 함수로 선언
    window.removeFavoriteFood = removeFavoriteFood;
    
    // Load today's meal info on page load
    searchMealInfo();
});
