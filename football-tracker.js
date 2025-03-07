document.addEventListener('DOMContentLoaded', function() {
    // Match state
    let matchState = {
        isMatchStarted: false,
        isFirstHalf: true,
        isHalfTime: false,
        startTime: null,
        elapsedTime: "00:00",
        currentHalfTime: 2 * 60, // 45 minutes in seconds
        teamA: {
            name: "Team A",
            color: "#1976D2",
            cards: [],
            substitutions: [],
            halfTimeSubstitutions: [], // Store half-time substitutions separately
            subWindows: 0,
            playerCount: 0, // Track number of players substituted
            goals: 0
        },
        teamB: {
            name: "Team B",
            color: "#D32F2F",
            cards: [],
            substitutions: [],
            halfTimeSubstitutions: [], // Store half-time substitutions separately
            subWindows: 0,
            playerCount: 0, // Track number of players substituted
            goals: 0
        },
        isInjuryTimeActive: false,
        isAddingInjuryTime: false,
        remainingInjuryTime: 0, // Remaining injury time in seconds
        totalInjurySeconds: 0,
        injuryTimePeriods: [],
        currentInjuryStartTime: null,
        currentInjuryTimeDisplay: "+00:00",
        activeSubWindow: {
            teamA: false,
            teamB: false
        }
    };

    // Timer variables
    let matchTimer;
    let injuryTimer;
    let autoSaveTimer;

    // DOM Elements
    const resetDataBtn = document.getElementById('resetDataBtn');
    const matchTimeEl = document.getElementById('matchTime');
    const injuryTimeEl = document.getElementById('injuryTime');
    const totalInjuryEl = document.getElementById('totalInjury');
    const startMatchBtn = document.getElementById('startMatchBtn');
    const matchControlsEl = document.getElementById('matchControls');
    const injuryControlsEl = document.getElementById('injuryControls');
    const injuryBtn = document.getElementById('injuryBtn');
    const injuryFab = document.getElementById('injuryFab');
    const teamAHeader = document.getElementById('teamAHeader');
    const teamBHeader = document.getElementById('teamBHeader');
    const endMatchBtn = document.getElementById('endMatchBtn');

    // Team A buttons
    const teamAYellowBtn = document.getElementById('teamAYellowBtn');
    const teamARedBtn = document.getElementById('teamARedBtn');
    const teamASubBtn = document.getElementById('teamASubBtn');
    const teamAGoalBtn = document.getElementById('teamAGoalBtn');

    // Team B buttons
    const teamBYellowBtn = document.getElementById('teamBYellowBtn');
    const teamBRedBtn = document.getElementById('teamBRedBtn');
    const teamBSubBtn = document.getElementById('teamBSubBtn');
    const teamBGoalBtn = document.getElementById('teamBGoalBtn');

    // Create half-time substitution buttons
    let teamAHalfSubBtn, teamBHalfSubBtn;

    // Content containers
    const teamACardsContent = document.getElementById('teamACardsContent');
    const teamASubsContent = document.getElementById('teamASubsContent');
    const teamBCardsContent = document.getElementById('teamBCardsContent');
    const teamBSubsContent = document.getElementById('teamBSubsContent');

    // Empty states
    const teamACardsEmpty = document.getElementById('teamACardsEmpty');
    const teamASubsEmpty = document.getElementById('teamASubsEmpty');
    const teamBCardsEmpty = document.getElementById('teamBCardsEmpty');
    const teamBSubsEmpty = document.getElementById('teamBSubsEmpty');

    // Tab elements
    const tabElements = document.querySelectorAll('.tab');

    // Settings button
    const settingsBtn = document.getElementById('settingsBtn');

    // Team Settings Modal
    const teamSettingsModal = document.getElementById('teamSettingsModal');
    const closeTeamSettingsBtn = document.getElementById('closeTeamSettingsBtn');
    const teamANameInput = document.getElementById('teamANameInput');
    const teamBNameInput = document.getElementById('teamBNameInput');
    const teamAColorPicker = document.getElementById('teamAColorPicker');
    const teamBColorPicker = document.getElementById('teamBColorPicker');
    const saveTeamSettingsBtn = document.getElementById('saveTeamSettingsBtn');
    const cancelTeamSettingsBtn = document.getElementById('cancelTeamSettingsBtn');

    // Card Modal (reused for goals)
    const cardModal = document.getElementById('cardModal');
    const cardModalTitle = document.getElementById('cardModalTitle');
    const playerNumberInput = document.getElementById('playerNumberInput');
    const saveCardBtn = document.getElementById('saveCardBtn');
    const cancelCardBtn = document.getElementById('cancelCardBtn');
    const closeCardModalBtn = document.getElementById('closeCardModalBtn');
    const cardModalActions = document.getElementById('cardModalActions');

    // Substitution Modal
    const subModal = document.getElementById('subModal');
    const subModalTitle = document.getElementById('subModalTitle');
    const playerInInput = document.getElementById('playerInInput');
    const playerOutInput = document.getElementById('playerOutInput');
    const saveSubBtn = document.getElementById('saveSubBtn');
    const cancelSubBtn = document.getElementById('cancelSubBtn');
    const closeSubModalBtn = document.getElementById('closeSubModalBtn');
    const subModalActions = document.getElementById('subModalActions');

    // Half-time Modal
    let halfTimeModal;

    // Add Another Player Substitution section
    const addAnotherSubSection = document.createElement('div');
    addAnotherSubSection.innerHTML = `
        <div class="input-group" id="additionalSubsContainer">
            <!-- Additional player substitutions will be added here -->
        </div>
        <button class="modal-btn add-btn" id="addAnotherSubBtn">
            <i class="fas fa-plus"></i> Add Another Substitution
        </button>
    `;

    // Injury Summary Modal
    const injurySummaryModal = document.getElementById('injurySummaryModal');
    const injurySummaryContent = document.getElementById('injurySummaryContent');
    const closeInjurySummaryBtn = document.getElementById('closeInjurySummaryBtn');
    const closeInjurySummaryConfirmBtn = document.getElementById('closeInjurySummaryConfirmBtn');

    // Reset Confirmation Modal
    const resetConfirmModal = document.getElementById('resetConfirmModal');
    const closeResetConfirmBtn = document.getElementById('closeResetConfirmBtn');
    const cancelResetBtn = document.getElementById('cancelResetBtn');
    const confirmResetBtn = document.getElementById('confirmResetBtn');

    // Match Summary Modal
    const matchSummaryModal = document.getElementById('matchSummaryModal');
    const matchSummaryContent = document.getElementById('matchSummaryContent');
    const closeMatchSummaryBtn = document.getElementById('closeMatchSummaryBtn');
    const closeMatchSummaryConfirmBtn = document.getElementById('closeMatchSummaryConfirmBtn');
    const saveAsPdfBtn = document.getElementById('saveAsPdfBtn');

    // Available team colors
    const availableColors = [
        '#1976D2', '#D32F2F', '#4CAF50', '#FF9800', '#9C27B0',
        '#009688', '#3F51B5', '#E91E63', '#FFC107', '#00BCD4',
        '#FF5722', '#673AB7', '#03A9F4', '#8BC34A'
    ];

    // Variables to track current modal context
    let currentCardContext = {
        isTeamA: true,
        isYellow: true,
        isGoal: false,
        cardToEdit: null
    };

    let currentSubContext = {
        isTeamA: true,
        isHalfTime: false,
        subToEdit: null,
        additionalSubs: []
    };

    // Initialize the page
function init() {
    createHalfTimeSubButtons();
    // คอมเมนต์บรรทัดนี้ออกถ้าไม่ต้องการสร้าง halfTimeModal
    // createHalfTimeModal(); 
    loadSavedMatchData();
    setupEventListeners();
    initColorPickers();
    autoSaveTimer = setInterval(saveMatchData, 10000);
    if (!matchState.isMatchStarted) {
        setTimeout(showTeamCustomizationDialog, 500);
    }
    updateSubstitutionButtonsState();
}

    // Create half-time substitution buttons
    function createHalfTimeSubButtons() {
        // Create Team A half-time sub button
        teamAHalfSubBtn = document.createElement('button');
        teamAHalfSubBtn.className = 'action-btn sub-btn-a';
        teamAHalfSubBtn.id = 'teamAHalfSubBtn';
        teamAHalfSubBtn.textContent = 'Half-time Sub';
        teamAHalfSubBtn.style.gridRow = '4';
        teamAHalfSubBtn.style.gridColumn = '1 / span 2';
        
        // Create Team B half-time sub button
        teamBHalfSubBtn = document.createElement('button');
        teamBHalfSubBtn.className = 'action-btn sub-btn-b';
        teamBHalfSubBtn.id = 'teamBHalfSubBtn';
        teamBHalfSubBtn.textContent = 'Half-time Sub';
        teamBHalfSubBtn.style.gridRow = '4';
        teamBHalfSubBtn.style.gridColumn = '1 / span 2';
        
        // Add buttons to the DOM
        const teamAActions = document.querySelector('.team-a .team-actions');
        const teamBActions = document.querySelector('.team-b .team-actions');
        
        teamAActions.appendChild(teamAHalfSubBtn);
        teamBActions.appendChild(teamBHalfSubBtn);
    }

    // Create the half-time modal
    function createHalfTimeModal() {
        halfTimeModal = document.createElement('div');
        halfTimeModal.className = 'modal';
        halfTimeModal.id = 'halfTimeModal';
        
        halfTimeModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Half-time</div>
                    <button class="close-btn" id="closeHalfTimeBtn">×</button>
                </div>
                <p>First half ended. Ready to start second half?</p>
                <div class="modal-actions">
                    <button class="modal-btn confirm-btn" id="startSecondHalfBtn">Start Second Half</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(halfTimeModal);
        
        // Add event listeners
        document.getElementById('closeHalfTimeBtn').addEventListener('click', () => {
            halfTimeModal.style.display = 'none';
        });
        
        document.getElementById('startSecondHalfBtn').addEventListener('click', startSecondHalf);
    }

    // Set up all event listeners
   function setupEventListeners() {
    startMatchBtn.addEventListener('click', startMatch);
    injuryBtn.addEventListener('click', toggleInjuryTime);
    injuryFab.addEventListener('click', toggleInjuryTime);
    endMatchBtn.addEventListener('click', endMatch);
    resetDataBtn.addEventListener('click', resetAllData);
   
    teamAYellowBtn.addEventListener('click', () => showCardDialog(true, true, false));
    teamARedBtn.addEventListener('click', () => showCardDialog(true, false, false));
    teamASubBtn.addEventListener('click', () => showSubstitutionDialog(true, false));
    
    // เพิ่มการตรวจสอบสำหรับปุ่ม Half-time Sub
    teamAHalfSubBtn.addEventListener('click', () => {
        if (matchState.isHalfTime) {
            showSubstitutionDialog(true, true);
        } else {
            alert('Half-time substitutions can only be made during half-time');
        }
    });
    
    teamAGoalBtn.addEventListener('click', () => showCardDialog(true, false, true));
    
    teamBYellowBtn.addEventListener('click', () => showCardDialog(false, true, false));
    teamBRedBtn.addEventListener('click', () => showCardDialog(false, false, false));
    teamBSubBtn.addEventListener('click', () => showSubstitutionDialog(false, false));
    
    // เพิ่มการตรวจสอบสำหรับปุ่ม Half-time Sub
    teamBHalfSubBtn.addEventListener('click', () => {
        if (matchState.isHalfTime) {
            showSubstitutionDialog(false, true);
        } else {
            alert('Half-time substitutions can only be made during half-time');
        }
    });
    
    teamBGoalBtn.addEventListener('click', () => showCardDialog(false, false, true));
    
    tabElements.forEach(tab => {
        tab.addEventListener('click', () => {
            const team = tab.dataset.team;
            const tabType = tab.dataset.tab;
            document.querySelectorAll(`.tab[data-team="${team}"]`).forEach(t => {
                t.classList.remove('active');
            });
            tab.classList.add('active');
            if (team === 'a') {
                teamACardsContent.classList.remove('active');
                teamASubsContent.classList.remove('active');
                if (tabType === 'cards') teamACardsContent.classList.add('active');
                else teamASubsContent.classList.add('active');
            } else {
                teamBCardsContent.classList.remove('active');
                teamBSubsContent.classList.remove('active');
                if (tabType === 'cards') teamBCardsContent.classList.add('active');
                else teamBSubsContent.classList.add('active');
            }
        });
    });
    
    settingsBtn.addEventListener('click', () => {
        if (!matchState.isMatchStarted) showTeamCustomizationDialog();
        else showResetConfirmDialog();
    });
    
    closeTeamSettingsBtn.addEventListener('click', () => teamSettingsModal.style.display = 'none');
    saveTeamSettingsBtn.addEventListener('click', saveTeamSettings);
    cancelTeamSettingsBtn.addEventListener('click', () => teamSettingsModal.style.display = 'none');
    
    closeCardModalBtn.addEventListener('click', () => cardModal.style.display = 'none');
    saveCardBtn.addEventListener('click', saveCardEvent);
    cancelCardBtn.addEventListener('click', () => cardModal.style.display = 'none');
    
    closeSubModalBtn.addEventListener('click', closeSubstitutionDialog);
    saveSubBtn.addEventListener('click', saveSubstitutionEvent);
    cancelSubBtn.addEventListener('click', closeSubstitutionDialog);
    
    closeInjurySummaryBtn.addEventListener('click', () => injurySummaryModal.style.display = 'none');
    closeInjurySummaryConfirmBtn.addEventListener('click', () => {
        injurySummaryModal.style.display = 'none';
        if (matchState.isHalfTime) {
            showHalfTimeDialog();
        }
    });
    
    closeResetConfirmBtn.addEventListener('click', () => resetConfirmModal.style.display = 'none');
    cancelResetBtn.addEventListener('click', () => resetConfirmModal.style.display = 'none');
    confirmResetBtn.addEventListener('click', resetAllData);

    closeMatchSummaryBtn.addEventListener('click', () => matchSummaryModal.style.display = 'none');
    closeMatchSummaryConfirmBtn.addEventListener('click', () => {
        matchSummaryModal.style.display = 'none';
        resetAllData();
    });
    saveAsPdfBtn.addEventListener('click', saveSummaryAsPdf);
    
    // ถ้ามีการใช้ Half-time Modal
    if (document.getElementById('closeHalfTimeBtn')) {
        document.getElementById('closeHalfTimeBtn').addEventListener('click', () => {
            halfTimeModal.style.display = 'none';
        });
    }
    
    if (document.getElementById('startSecondHalfBtn')) {
        document.getElementById('startSecondHalfBtn').addEventListener('click', startSecondHalf);
    }
}
    // Initialize color pickers
    function initColorPickers() {
        teamAColorPicker.innerHTML = '';
        teamBColorPicker.innerHTML = '';
        
        availableColors.forEach(color => {
            const optionA = document.createElement('div');
            optionA.className = 'color-option';
            optionA.style.backgroundColor = color;
            if (color === matchState.teamA.color) optionA.classList.add('selected');
            optionA.addEventListener('click', () => {
                document.querySelectorAll('#teamAColorPicker .color-option').forEach(opt => opt.classList.remove('selected'));
                optionA.classList.add('selected');
            });
            teamAColorPicker.appendChild(optionA);
            
            const optionB = document.createElement('div');
            optionB.className = 'color-option';
            optionB.style.backgroundColor = color;
            if (color === matchState.teamB.color) optionB.classList.add('selected');
            optionB.addEventListener('click', () => {
                document.querySelectorAll('#teamBColorPicker .color-option').forEach(opt => opt.classList.remove('selected'));
                optionB.classList.add('selected');
            });
            teamBColorPicker.appendChild(optionB);
        });
    }

    // Load saved match data
    function loadSavedMatchData() {
        const savedData = localStorage.getItem('matchData');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            matchState = {
                ...matchState,
                ...parsedData,
                startTime: parsedData.startTime ? new Date(parsedData.startTime) : null,
                currentInjuryStartTime: parsedData.currentInjuryStartTime ? new Date(parsedData.currentInjuryStartTime) : null,
                teamA: { 
                    ...matchState.teamA, 
                    ...parsedData.teamA, 
                    goals: parsedData.teamA.goals || 0,
                    playerCount: parsedData.teamA.playerCount || 0,
                    halfTimeSubstitutions: parsedData.teamA.halfTimeSubstitutions || []
                },
                teamB: { 
                    ...matchState.teamB, 
                    ...parsedData.teamB, 
                    goals: parsedData.teamB.goals || 0,
                    playerCount: parsedData.teamB.playerCount || 0,
                    halfTimeSubstitutions: parsedData.teamB.halfTimeSubstitutions || []
                }
            };
            
            if (matchState.teamA.subWindows === undefined) {
                matchState.teamA.subWindows = calculateUsedSubWindows(matchState.teamA.substitutions);
            }
            if (matchState.teamB.subWindows === undefined) {
                matchState.teamB.subWindows = calculateUsedSubWindows(matchState.teamB.substitutions);
            }
            if (!matchState.activeSubWindow) {
                matchState.activeSubWindow = { teamA: false, teamB: false };
            }
            updateUI();
            if (matchState.isMatchStarted) startTimers();
        }
    }

    function calculateUsedSubWindows(substitutions) {
        if (!substitutions || substitutions.length === 0) return 0;
        const windows = new Set();
        substitutions.forEach(sub => {
            windows.add(sub.windowId || sub.id);
        });
        return windows.size;
    }

    function saveMatchData() {
        localStorage.setItem('matchData', JSON.stringify({
            ...matchState,
            startTime: matchState.startTime ? matchState.startTime.toISOString() : null,
            currentInjuryStartTime: matchState.currentInjuryStartTime ? matchState.currentInjuryStartTime.toISOString() : null
        }));
    }

    function clearMatchData() {
        localStorage.removeItem('matchData');
    }

   function updateUI() {
    teamAHeader.textContent = matchState.teamA.name;
    teamAHeader.style.backgroundColor = matchState.teamA.color;
    teamBHeader.textContent = matchState.teamB.name;
    teamBHeader.style.backgroundColor = matchState.teamB.color;
    
    // อัปเดตคะแนนในส่วนหัว
    const teamAScoreEl = document.getElementById('teamAScore');
    const teamBScoreEl = document.getElementById('teamBScore');
    teamAScoreEl.textContent = matchState.teamA.goals;
    teamBScoreEl.textContent = matchState.teamB.goals;
    
    teamASubBtn.style.backgroundColor = matchState.teamA.color;
    teamBSubBtn.style.backgroundColor = matchState.teamB.color;
    teamAHalfSubBtn.style.backgroundColor = matchState.teamA.color;
    teamBHalfSubBtn.style.backgroundColor = matchState.teamB.color;
    
    // ปรับการแสดงปุ่ม Half-time Sub ให้แสดงเฉพาะช่วงพักครึ่งเท่านั้น
    if (matchState.isHalfTime) {
        // ช่วงพักครึ่ง: แสดงปุ่ม Half-time Sub, ซ่อนปุ่ม Substitution
        teamAHalfSubBtn.style.display = 'block';
        teamBHalfSubBtn.style.display = 'block';
        teamASubBtn.style.display = 'none';
        teamBSubBtn.style.display = 'none';
    } else {
        // ระหว่างการแข่งขัน หรือก่อนเริ่มเกม: ซ่อนปุ่ม Half-time Sub, แสดงปุ่ม Substitution
        teamAHalfSubBtn.style.display = 'none';
        teamBHalfSubBtn.style.display = 'none';
        teamASubBtn.style.display = 'block';
        teamBSubBtn.style.display = 'block';
    }
    
    updateSubstitutionButtonsState();
    
    // แสดงเวลาการแข่งขัน
    matchTimeEl.textContent = matchState.elapsedTime;
    
    if (matchState.isInjuryTimeActive) {
        injuryTimeEl.textContent = matchState.currentInjuryTimeDisplay;
        injuryTimeEl.style.display = 'block';
        totalInjuryEl.style.display = 'none';
        injuryBtn.classList.add('active');
        injuryBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Stop Injury Time';
        injuryFab.classList.add('injury-active');
        injuryFab.innerHTML = '<i class="fas fa-stopwatch"></i>';
    } else if (matchState.totalInjurySeconds > 0) {
        injuryTimeEl.style.display = 'none';
        totalInjuryEl.textContent = getTotalInjuryTimeDisplay();
        totalInjuryEl.style.display = 'block';
        injuryBtn.classList.remove('active');
        injuryBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Injury Time';
        injuryFab.classList.remove('injury-active');
        injuryFab.innerHTML = '<i class="fas fa-stopwatch"></i>';
    } else {
        injuryTimeEl.style.display = 'none';
        totalInjuryEl.style.display = 'none';
        injuryBtn.classList.remove('active');
        injuryBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Injury Time';
        injuryFab.classList.remove('injury-active');
        injuryFab.innerHTML = '<i class="fas fa-stopwatch"></i>';
    }
    
    // แสดง/ซ่อน ปุ่มควบคุมตามสถานะของการแข่งขัน
    if (matchState.isMatchStarted && !matchState.isHalfTime) {
        // เมื่อแข่งขันกำลังดำเนินอยู่
        matchControlsEl.style.display = 'none';
        
        // ซ่อนปุ่ม Injury Time เมื่ออยู่ในช่วงนับถอยหลังเวลาบาดเจ็บ
        if (matchState.isAddingInjuryTime) {
            injuryControlsEl.style.display = 'flex';
            injuryFab.style.display = 'none';
            injuryBtn.style.display = 'none'; // ซ่อนปุ่ม Injury Time
        } else {
            injuryControlsEl.style.display = 'flex';
            injuryFab.style.display = 'flex';
            injuryBtn.style.display = 'block'; // แสดงปุ่ม Injury Time
        }
        
        // อัปเดตข้อความปุ่มสำหรับครึ่งหลัง
        if (!matchState.isFirstHalf) {
            startMatchBtn.innerHTML = '<i class="fas fa-play"></i> Start Second Half';
        }
    } else if (matchState.isHalfTime) {
        // ในช่วงพักครึ่ง
        matchControlsEl.style.display = 'flex';
        injuryControlsEl.style.display = 'none';
        injuryFab.style.display = 'none';
        startMatchBtn.innerHTML = '<i class="fas fa-play"></i> Start Second Half';
    } else {
        // ก่อนเริ่มการแข่งขัน หรือจบการแข่งขันแล้ว
        matchControlsEl.style.display = 'flex';
        injuryControlsEl.style.display = 'none';
        injuryFab.style.display = 'none';
        startMatchBtn.innerHTML = '<i class="fas fa-play"></i> Start Match';
    }
    
    renderTeamCards();
    renderTeamSubstitutions();
}

    function updateSubstitutionButtonsState() {
        // Check for max 5 players substituted per team
        if (matchState.isMatchStarted || matchState.isHalfTime) {
            // Team A substitution button state
            const teamAPlayerSubCount = getPlayerSubCount(true);
            const teamAWindowsUsed = matchState.teamA.subWindows;
            
            if (teamAPlayerSubCount >= 5) {
                teamASubBtn.disabled = true;
                teamASubBtn.classList.add('disabled');
                teamASubBtn.innerHTML = 'Max 5 Players Subbed';
                
                teamAHalfSubBtn.disabled = true;
                teamAHalfSubBtn.classList.add('disabled');
                teamAHalfSubBtn.innerHTML = 'Max 5 Players Subbed';
            } else if (teamAWindowsUsed >= 3 && !matchState.activeSubWindow.teamA && !matchState.isHalfTime) {
                teamASubBtn.disabled = true;
                teamASubBtn.classList.add('disabled');
                teamASubBtn.innerHTML = 'Sub Windows Exhausted';
                
                // Half-time subs don't count toward the 3 windows
                teamAHalfSubBtn.disabled = false;
                teamAHalfSubBtn.classList.remove('disabled');
                teamAHalfSubBtn.innerHTML = 'Half-time Sub';
            } else {
                teamASubBtn.disabled = false;
                teamASubBtn.classList.remove('disabled');
                teamASubBtn.innerHTML = 'Substitution' + (matchState.activeSubWindow.teamA ? ' (Active)' : '');
                
                teamAHalfSubBtn.disabled = false;
                teamAHalfSubBtn.classList.remove('disabled');
                teamAHalfSubBtn.innerHTML = 'Half-time Sub';
            }
            
            // Team B substitution button state
            const teamBPlayerSubCount = getPlayerSubCount(false);
            const teamBWindowsUsed = matchState.teamB.subWindows;
            
            if (teamBPlayerSubCount >= 5) {
                teamBSubBtn.disabled = true;
                teamBSubBtn.classList.add('disabled');
                teamBSubBtn.innerHTML = 'Max 5 Players Subbed';
                
                teamBHalfSubBtn.disabled = true;
                teamBHalfSubBtn.classList.add('disabled');
                teamBHalfSubBtn.innerHTML = 'Max 5 Players Subbed';
            } else if (teamBWindowsUsed >= 3 && !matchState.activeSubWindow.teamB && !matchState.isHalfTime) {
                teamBSubBtn.disabled = true;
                teamBSubBtn.classList.add('disabled');
                teamBSubBtn.innerHTML = 'Sub Windows Exhausted';
                
                // Half-time subs don't count toward the 3 windows
                teamBHalfSubBtn.disabled = false;
                teamBHalfSubBtn.classList.remove('disabled');
                teamBHalfSubBtn.innerHTML = 'Half-time Sub';
            } else {
                teamBSubBtn.disabled = false;
                teamBSubBtn.classList.remove('disabled');
                teamBSubBtn.innerHTML = 'Substitution' + (matchState.activeSubWindow.teamB ? ' (Active)' : '');
                
                teamBHalfSubBtn.disabled = false;
                teamBHalfSubBtn.classList.remove('disabled');
                teamBHalfSubBtn.innerHTML = 'Half-time Sub';
            }
        }
    }

    // Get total player substitution count for a team
    function getPlayerSubCount(isTeamA) {
        const team = isTeamA ? matchState.teamA : matchState.teamB;
        let playerCount = 0;
        
        // Count regular substitutions
        team.substitutions.forEach(sub => {
            // For each substitution window, count the number of players
            if (!sub.windowId) {
                playerCount++; // Count single subs (legacy data)
            }
        });
        
        // Count windows properly
        const windows = new Set();
        team.substitutions.forEach(sub => {
            if (sub.windowId) {
                windows.add(sub.windowId);
            }
        });
        
        // For each window, find how many players were substituted
        windows.forEach(windowId => {
            const windowSubs = team.substitutions.filter(sub => sub.windowId === windowId);
            playerCount += windowSubs.length;
        });
        
        // Add half-time substitutions
        playerCount += team.halfTimeSubstitutions.length;
        
        return playerCount;
    }

    function renderTeamCards() {
        const teamACardsHTML = matchState.teamA.cards.map(card => createCardHTML(card, true)).join('');
        if (teamACardsHTML) {
            teamACardsEmpty.style.display = 'none';
            teamACardsContent.innerHTML = teamACardsEmpty.outerHTML + teamACardsHTML;
        } else {
            teamACardsEmpty.style.display = 'flex';
        }
        
        const teamBCardsHTML = matchState.teamB.cards.map(card => createCardHTML(card, false)).join('');
        if (teamBCardsHTML) {
            teamBCardsEmpty.style.display = 'none';
            teamBCardsContent.innerHTML = teamBCardsEmpty.outerHTML + teamBCardsHTML;
        } else {
            teamBCardsEmpty.style.display = 'flex';
        }
    }

    function createCardHTML(card, isTeamA) {
        const eventType = card.isYellow ? 'Yellow Card' : (card.isGoal ? 'Goal' : 'Red Card');
        return `
            <div class="event-card" data-id="${card.id}">
                <div class="event-icon ${card.isYellow ? 'yellow-icon' : (card.isGoal ? 'goal-icon' : 'red-icon')}">
                    <i class="fas fa-${card.isGoal ? 'futbol' : 'square'}"></i>
                </div>
                <div class="event-details">
                    <div class="event-title">${eventType} - #${card.playerNumber}</div>
                    <div class="event-time">Time: ${card.timeStamp}</div>
                </div>
                <button class="edit-btn" onclick="editCard('${card.id}', ${isTeamA})">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
    }

    function groupSubstitutionsByWindow(subs) {
        const windows = {};
        subs.forEach(sub => {
            const windowId = sub.windowId || sub.id;
            if (!windows[windowId]) {
                windows[windowId] = {
                    id: windowId,
                    substitutions: [],
                    timeStamp: sub.timeStamp,
                    isHalfTime: sub.isHalfTime || false
                };
            }
            windows[windowId].substitutions.push(sub);
        });
        return Object.values(windows).sort((a, b) => {
            // Half-time subs should be sorted before regular subs
            if (a.isHalfTime && !b.isHalfTime) return -1;
            if (!a.isHalfTime && b.isHalfTime) return 1;
            
            const timeA = a.timeStamp.replace(/\+.*$/, '');
            const timeB = b.timeStamp.replace(/\+.*$/, '');
            const [minsA, secsA] = timeA.split(':').map(Number);
            const [minsB, secsB] = timeB.split(':').map(Number);
            if (minsA !== minsB) return minsA - minsB;
            return secsA - secsB;
        });
    }

    function renderTeamSubstitutions() {
        // Get all substitutions including half-time subs
        const teamASubs = [...matchState.teamA.substitutions];
        const teamBSubs = [...matchState.teamB.substitutions];
        
        // Add half-time substitutions with special marking
        matchState.teamA.halfTimeSubstitutions.forEach(sub => {
            teamASubs.push({...sub, isHalfTime: true});
        });
        
        matchState.teamB.halfTimeSubstitutions.forEach(sub => {
            teamBSubs.push({...sub, isHalfTime: true});
        });
        
        const teamASubWindows = groupSubstitutionsByWindow(teamASubs);
        const teamBSubWindows = groupSubstitutionsByWindow(teamBSubs);
        
        const teamASubsHTML = teamASubWindows.map((window, index) => 
            createSubWindowHTML(window, index + 1, true)
        ).join('');
        
        const teamBSubsHTML = teamBSubWindows.map((window, index) => 
            createSubWindowHTML(window, index + 1, false)
        ).join('');
        
        if (teamASubsHTML) {
            teamASubsEmpty.style.display = 'none';
            teamASubsContent.innerHTML = teamASubsEmpty.outerHTML + teamASubsHTML;
        } else {
            teamASubsEmpty.style.display = 'flex';
        }
        
        if (teamBSubsHTML) {
            teamBSubsEmpty.style.display = 'none';
            teamBSubsContent.innerHTML = teamBSubsEmpty.outerHTML + teamBSubsHTML;
        } else {
            teamBSubsEmpty.style.display = 'flex';
        }
    }

    function createSubWindowHTML(window, windowNumber, isTeamA) {
        const subsHTML = window.substitutions.map(sub => 
            `<div class="sub-entry">
                <span class="player-numbers">#${sub.playerInNumber} In, #${sub.playerOutNumber} Out</span>
            </div>`
        ).join('');
        
        const windowTitle = window.isHalfTime ? 
            "Half-time Substitution" : 
            `Substitution Window ${windowNumber}`;
            
        return `
            <div class="event-card sub-window" data-id="${window.id}" data-half-time="${window.isHalfTime}">
                <div class="event-icon ${isTeamA ? 'sub-icon-a' : 'sub-icon-b'}">
                    <i class="fas fa-exchange-alt"></i>
                </div>
                <div class="event-details">
                    <div class="event-title">${windowTitle} (${window.substitutions.length} Players)</div>
                    <div class="event-time">Time: ${window.timeStamp}</div>
                    <div class="substitutions-list">
                        ${subsHTML}
                    </div>
                </div>
                <button class="edit-btn" onclick="editSubstitutionWindow('${window.id}', ${isTeamA}, ${window.isHalfTime})">
                    <i class="fas fa-edit"></i>
                </button>
            </div>
        `;
    }

    function startMatch() {
        matchState.isMatchStarted = true;
        
        if (matchState.isHalfTime) {
            // Starting second half
            matchState.isHalfTime = false;
            matchState.isFirstHalf = false;
            
            // Set elapsed time to start at 45:00
            matchState.elapsedTime = "2:00";
            const now = new Date();
            matchState.startTime = new Date(now.getTime() - (2 * 60 * 1000)); // Set start time 45 minutes earlier
        } else {
            // Starting first half
            matchState.startTime = new Date();
            matchState.elapsedTime = "00:00";
            matchState.isFirstHalf = true;
        }
        
        startTimers();
        updateUI();
        saveMatchData();
    }

   function startSecondHalf() {
    if (halfTimeModal && halfTimeModal.style.display === 'flex') {
        halfTimeModal.style.display = 'none';
    }
    startMatch();
}
    function startTimers() {
        clearInterval(matchTimer);
        clearInterval(injuryTimer);
        
        if (matchState.isAddingInjuryTime) {
            // We're in injury time mode after a half
            injuryTimer = setInterval(updateInjuryTimeCountdown, 1000);
        } else {
            // Normal match time
            matchTimer = setInterval(updateMatchTime, 1000);
            
            if (matchState.isInjuryTimeActive && matchState.currentInjuryStartTime) {
                injuryTimer = setInterval(updateInjuryTime, 1000);
            }
        }
    }

    function updateMatchTime() {
        if (!matchState.startTime) return;
        
        const now = new Date();
        const difference = now - matchState.startTime;
        const totalSeconds = Math.floor(difference / 1000);
        
        // Calculate minutes and seconds
        let minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        
        // Check for half-time or end of match
        if (matchState.isFirstHalf && minutes >= 2 && seconds >= 0 && !matchState.isInjuryTimeActive) {
            // First half is over, stop timer and prepare for injury time
            clearInterval(matchTimer);
            minutes = 2; // Lock at 45:00
            
            // Check if we have injury time
            if (matchState.totalInjurySeconds > 0) {
                prepareInjuryTimeCountdown(matchState.totalInjurySeconds);
            } else {
                // No injury time, go directly to half-time
                endFirstHalf();
            }
        } else if (!matchState.isFirstHalf && minutes >= 4 && seconds >= 0 && !matchState.isInjuryTimeActive) {
            // Second half is over, stop timer and prepare for injury time
            clearInterval(matchTimer);
            minutes = 4; // Lock at 90:00
            
            // Check if we have injury time
            if (matchState.totalInjurySeconds > 0) {
                prepareInjuryTimeCountdown(matchState.totalInjurySeconds);
            } else {
                // No injury time, end the match
                endMatch();
            }
        }
        
        // Update the display
        matchState.elapsedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        matchTimeEl.textContent = matchState.elapsedTime;
    }

   function prepareInjuryTimeCountdown(seconds) {
    matchState.isAddingInjuryTime = true;
    matchState.remainingInjuryTime = seconds;
    
    // Show injury time indicator
    injuryTimeEl.textContent = getTotalInjuryTimeDisplay();
    injuryTimeEl.style.display = 'block';
    
    // ซ่อนปุ่ม Injury Time และ Injury FAB ในช่วงนับถอยหลัง
    injuryBtn.style.display = 'none';
    injuryFab.style.display = 'none';
    
    // Start countdown
    injuryTimer = setInterval(updateInjuryTimeCountdown, 1000);
}

    function updateInjuryTimeCountdown() {
        if (matchState.remainingInjuryTime <= 0) {
            // Injury time is over
            clearInterval(injuryTimer);
            
            if (matchState.isFirstHalf) {
                endFirstHalf();
            } else {
                endMatch();
            }
            return;
        }
        
        // Update remaining time
        matchState.remainingInjuryTime--;
        const minutes = Math.floor(matchState.remainingInjuryTime / 60);
        const seconds = matchState.remainingInjuryTime % 60;
        const display = `+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        
        injuryTimeEl.textContent = display;
    }

   function endFirstHalf() {
    // Clear timers and reset injury time data
    clearInterval(matchTimer);
    clearInterval(injuryTimer);
    
    // Set match state for half-time
    matchState.isHalfTime = true;
    matchState.isMatchStarted = false;
    matchState.isInjuryTimeActive = false;
    matchState.isAddingInjuryTime = false;
    matchState.totalInjurySeconds = 0;
    matchState.injuryTimePeriods = [];
    matchState.currentInjuryStartTime = null;
    matchState.currentInjuryTimeDisplay = "+00:00";
    
    // Lock display at 02:00 (หรือ 45:00 สำหรับเวลาปกติ)
    matchState.elapsedTime = "02:00";  // หรือ "45:00"
    
    // ซ่อนปุ่ม Injury Time ในช่วงพักครึ่ง
    injuryBtn.style.display = 'none';
    injuryFab.style.display = 'none';
    
    // Update UI and save data
    updateUI();
    saveMatchData();
}

    function showHalfTimeDialog() {
        halfTimeModal.style.display = 'flex';
    }

    function toggleInjuryTime() {
        if (!matchState.isMatchStarted) {
            alert('Please start the match first');
            return;
        }
        
        matchState.isInjuryTimeActive = !matchState.isInjuryTimeActive;
        
        if (matchState.isInjuryTimeActive) {
            matchState.currentInjuryStartTime = new Date();
            injuryTimer = setInterval(updateInjuryTime, 1000);
            injuryTimeEl.style.display = 'block';
            totalInjuryEl.style.display = 'none';
            injuryBtn.classList.add('active');
            injuryBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Stop Injury Time';
            injuryFab.classList.add('injury-active');
        } else {
            if (matchState.currentInjuryStartTime) {
                const now = new Date();
                const injuryDuration = now - matchState.currentInjuryStartTime;
                const injurySeconds = Math.floor(injuryDuration / 1000);
                matchState.totalInjurySeconds += injurySeconds;
                const mins = String(Math.floor(injurySeconds / 60)).padStart(2, '0');
                const secs = String(injurySeconds % 60).padStart(2, '0');
                matchState.injuryTimePeriods.push(`+${mins}:${secs}`);
                showInjuryTimeSummary(injurySeconds);
            }
            clearInterval(injuryTimer);
            matchState.currentInjuryStartTime = null;
            matchState.currentInjuryTimeDisplay = '+00:00';
            injuryTimeEl.style.display = 'none';
            totalInjuryEl.textContent = getTotalInjuryTimeDisplay();
            totalInjuryEl.style.display = 'block';
            injuryBtn.classList.remove('active');
            injuryBtn.innerHTML = '<i class="fas fa-stopwatch"></i> Injury Time';
            injuryFab.classList.remove('injury-active');
        }
        
        saveMatchData();
    }

    function updateInjuryTime() {
        if (!matchState.currentInjuryStartTime) return;
        const now = new Date();
        const difference = now - matchState.currentInjuryStartTime;
        const minutes = Math.floor(difference / 60000);
        const seconds = Math.floor((difference % 60000) / 1000);
        matchState.currentInjuryTimeDisplay = `+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        injuryTimeEl.textContent = matchState.currentInjuryTimeDisplay;
    }

    function getTotalInjuryTimeDisplay() {
        const minutes = Math.floor(matchState.totalInjurySeconds / 60);
        const seconds = matchState.totalInjurySeconds % 60;
        return `+${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }

    function showInjuryTimeSummary(currentPeriodSeconds) {
        const totalMins = String(Math.floor(matchState.totalInjurySeconds / 60)).padStart(2, '0');
        const totalSecs = String(matchState.totalInjurySeconds % 60).padStart(2, '0');
        const currentMins = String(Math.floor(currentPeriodSeconds / 60)).padStart(2, '0');
        const currentSecs = String(currentPeriodSeconds % 60).padStart(2, '0');
        
        let summaryHTML = `
            <p>Current Injury Time Period: +${currentMins}:${currentSecs}</p>
            <p style="margin-top: 8px;">Total Accumulated Injury Time: +${totalMins}:${totalSecs}</p>
        `;
        
        if (matchState.injuryTimePeriods.length > 1) {
            summaryHTML += `
                <div style="margin-top: 16px;">
                    <p>Injury Time History:</p>
                    <div style="margin-top: 8px;">
                        ${matchState.injuryTimePeriods.map((period, index) => 
                            `<p>Period ${index + 1}: ${period}</p>`
                        ).join('')}
                    </div>
                </div>
            `;
        }
        
        injurySummaryContent.innerHTML = summaryHTML;
        injurySummaryModal.style.display = 'flex';
    }

    function showTeamCustomizationDialog() {
        teamANameInput.value = matchState.teamA.name;
        teamBNameInput.value = matchState.teamB.name;
        initColorPickers();
        teamSettingsModal.style.display = 'flex';
    }

    function saveTeamSettings() {
        const teamAName = teamANameInput.value.trim() || 'Team A';
        const teamBName = teamBNameInput.value.trim() || 'Team B';
        const teamAColorOption = document.querySelector('#teamAColorPicker .color-option.selected');
        const teamBColorOption = document.querySelector('#teamBColorPicker .color-option.selected');
        const teamAColor = teamAColorOption ? teamAColorOption.style.backgroundColor : matchState.teamA.color;
        const teamBColor = teamBColorOption ? teamBColorOption.style.backgroundColor : matchState.teamB.color;
        
        matchState.teamA.name = teamAName;
        matchState.teamA.color = teamAColor;
        matchState.teamB.name = teamBName;
        matchState.teamB.color = teamBColor;
        
        updateUI();
        saveMatchData();
        teamSettingsModal.style.display = 'none';
    }

    function showCardDialog(isTeamA, isYellow, isGoal, cardToEdit = null) {
        if (!matchState.isMatchStarted && !matchState.isHalfTime && !cardToEdit) {
            alert('Please start the match first');
            return;
        }
        
        currentCardContext = { isTeamA, isYellow, isGoal, cardToEdit };
        const teamName = isTeamA ? matchState.teamA.name : matchState.teamB.name;
        const eventType = isGoal ? 'Goal' : (isYellow ? 'Yellow Card' : 'Red Card');
        cardModalTitle.textContent = `${cardToEdit ? 'Edit ' : ''}${eventType} - ${teamName}`;
        playerNumberInput.value = cardToEdit ? cardToEdit.playerNumber : '';
        
        if (cardToEdit) {
            let deleteBtn = document.getElementById('deleteCardBtn');
            if (!deleteBtn) {
                deleteBtn = document.createElement('button');
                deleteBtn.id = 'deleteCardBtn';
                deleteBtn.className = 'modal-btn delete-btn';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', deleteCardEvent);
                cardModalActions.insertBefore(deleteBtn, cancelCardBtn);
            }
        } else {
            const deleteBtn = document.getElementById('deleteCardBtn');
            if (deleteBtn) deleteBtn.remove();
        }
        
        saveCardBtn.style.backgroundColor = isGoal ? '#4CAF50' : (isYellow ? '#FFC107' : '#D32F2F');
        saveCardBtn.style.color = isYellow ? 'black' : 'white';
        cardModal.style.display = 'flex';
        playerNumberInput.focus();
    }

    function saveCardEvent() {
        const playerNumber = playerNumberInput.value.trim();
        if (!playerNumber) {
            alert('Please enter a player number');
            return;
        }
        
        const { isTeamA, isYellow, isGoal, cardToEdit } = currentCardContext;
        const currentTimeStamp = cardToEdit ? cardToEdit.timeStamp : 
            matchState.isHalfTime ? "Half-time" :
            (matchState.isInjuryTimeActive ? 
                `${matchState.elapsedTime} ${matchState.currentInjuryTimeDisplay}` : 
                matchState.elapsedTime);
        
        if (cardToEdit) {
            cardToEdit.playerNumber = playerNumber;
            if (cardToEdit.isGoal && !isGoal) {
                if (isTeamA) matchState.teamA.goals--;
                else matchState.teamB.goals--;
            } else if (!cardToEdit.isGoal && isGoal) {
                if (isTeamA) matchState.teamA.goals++;
                else matchState.teamB.goals++;
            }
        } else {
            const newCard = {
                id: Date.now().toString(),
                isYellow,
                isGoal,
                timeStamp: currentTimeStamp,
                playerNumber
            };
            if (isTeamA) {
                matchState.teamA.cards.push(newCard);
                if (isGoal) matchState.teamA.goals++;
            } else {
                matchState.teamB.cards.push(newCard);
                if (isGoal) matchState.teamB.goals++;
            }
        }
        
        renderTeamCards();
        updateUI();
        saveMatchData();
        cardModal.style.display = 'none';
    }

    function deleteCardEvent() {
        const { isTeamA, cardToEdit } = currentCardContext;
        if (!cardToEdit) return;
        if (isTeamA) {
            matchState.teamA.cards = matchState.teamA.cards.filter(card => card.id !== cardToEdit.id);
            if (cardToEdit.isGoal) matchState.teamA.goals--;
        } else {
            matchState.teamB.cards = matchState.teamB.cards.filter(card => card.id !== cardToEdit.id);
            if (cardToEdit.isGoal) matchState.teamB.goals--;
        }
        renderTeamCards();
        updateUI();
        saveMatchData();
        cardModal.style.display = 'none';
    }

    function showSubstitutionDialog(isTeamA, isHalfTime, windowToEdit = null) {
    // ตรวจสอบว่าสามารถกดปุ่ม Half-time Sub ได้เฉพาะในช่วงพักครึ่งเท่านั้น
    if (isHalfTime && !matchState.isHalfTime && !windowToEdit) {
        alert('Half-time substitutions can only be made during half-time');
        return;
    }
    
    // ตรวจสอบว่าเกมเริ่มแล้วหรือยัง (สำหรับการเปลี่ยนตัวปกติ)
    if (!matchState.isMatchStarted && !matchState.isHalfTime && !isHalfTime && !windowToEdit) {
        alert('Please start the match first');
        return;
    }
    
    // ตรวจสอบจำนวนผู้เล่นที่เปลี่ยนตัวสูงสุด (5 คน)
    const playerSubCount = getPlayerSubCount(isTeamA);
    if (playerSubCount >= 5 && !windowToEdit) {
        alert(`${isTeamA ? matchState.teamA.name : matchState.teamB.name} has already used all 5 player substitutions`);
        return;
    }
    
    // ตรวจสอบจำนวนช่วงเปลี่ยนตัวสูงสุด (3 ช่วง สำหรับการเปลี่ยนตัวปกติ ไม่รวมพักครึ่ง)
    if (!isHalfTime && !windowToEdit && !matchState.activeSubWindow[isTeamA ? 'teamA' : 'teamB']) {
        const team = isTeamA ? matchState.teamA : matchState.teamB;
        if (team.subWindows >= 3) {
            alert(`${team.name} has used all 3 substitution windows`);
            return;
        }
    }
    
    currentSubContext = { isTeamA, isHalfTime, windowToEdit, additionalSubs: [] };
    const teamName = isTeamA ? matchState.teamA.name : matchState.teamB.name;
    const subType = isHalfTime ? "Half-time Substitution" : "Substitution";
    subModalTitle.textContent = `${windowToEdit ? 'Edit ' : ''}${subType} - ${teamName}`;
    playerInInput.value = '';
    playerOutInput.value = '';
    
    const additionalSubsContainer = document.getElementById('additionalSubsContainer');
    if (!additionalSubsContainer) {
        const modalContent = subModal.querySelector('.modal-content');
        modalContent.insertBefore(addAnotherSubSection, subModalActions);
        document.getElementById('addAnotherSubBtn').addEventListener('click', addAnotherSubstitution);
    } else {
        additionalSubsContainer.innerHTML = '';
    }
    
    if (windowToEdit) {
        let subs;
        // ตรวจสอบว่ากำลังแก้ไขการเปลี่ยนตัวช่วงพักครึ่งหรือช่วงปกติ
        if (isHalfTime || (windowToEdit && document.querySelector(`.event-card[data-id="${windowToEdit}"][data-half-time="true"]`))) {
            subs = (isTeamA ? matchState.teamA.halfTimeSubstitutions : matchState.teamB.halfTimeSubstitutions)
                .filter(sub => sub.windowId === windowToEdit || sub.id === windowToEdit);
        } else {
            subs = (isTeamA ? matchState.teamA.substitutions : matchState.teamB.substitutions)
                .filter(sub => sub.windowId === windowToEdit || sub.id === windowToEdit);
        }
        
        if (subs.length > 0) {
            playerInInput.value = subs[0].playerInNumber;
            playerOutInput.value = subs[0].playerOutNumber;
            if (subs.length > 1) {
                for (let i = 1; i < subs.length; i++) {
                    const newSubFields = createSubstitutionFields(subs[i].playerInNumber, subs[i].playerOutNumber);
                    document.getElementById('additionalSubsContainer').appendChild(newSubFields);
                }
            }
        }
        
        let deleteBtn = document.getElementById('deleteSubWindowBtn');
        if (!deleteBtn) {
            deleteBtn = document.createElement('button');
            deleteBtn.id = 'deleteSubWindowBtn';
            deleteBtn.className = 'modal-btn delete-btn';
            deleteBtn.textContent = 'Delete This Substitution Window';
            deleteBtn.addEventListener('click', deleteSubstitutionWindow);
            subModalActions.insertBefore(deleteBtn, cancelSubBtn);
        }
    } else {
        const deleteBtn = document.getElementById('deleteSubWindowBtn');
        if (deleteBtn) deleteBtn.remove();
    }
    
    saveSubBtn.style.backgroundColor = isTeamA ? matchState.teamA.color : matchState.teamB.color;
    subModal.style.display = 'flex';
    playerInInput.focus();
}

    function createSubstitutionFields(playerIn = '', playerOut = '') {
        const subFieldsContainer = document.createElement('div');
        subFieldsContainer.className = 'substitution-fields';
        subFieldsContainer.innerHTML = `
            <div class="sub-header">
                <span>Additional Player</span>
                <button type="button" class="remove-sub-btn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="input-group">
                <div class="input-label">Player In Number</div>
                <input type="number" class="input-field player-in" placeholder="Player In Number" value="${playerIn}">
            </div>
            <div class="input-group">
                <div class="input-label">Player Out Number</div>
                <input type="number" class="input-field player-out" placeholder="Player Out Number" value="${playerOut}">
            </div>
        `;
        
        subFieldsContainer.querySelector('.remove-sub-btn').addEventListener('click', function() {
            subFieldsContainer.remove();
        });
        
        return subFieldsContainer;
    }

    function addAnotherSubstitution() {
        // Check max player substitutions (5 players) including the new ones being added
        const { isTeamA } = currentSubContext;
        const currentCount = getPlayerSubCount(isTeamA);
        const additionalFields = document.querySelectorAll('#additionalSubsContainer .substitution-fields').length;
        
        // Count main substitution + additional ones already showing + this new one
        if (currentCount + additionalFields + 1 >= 5) {
            alert(`${isTeamA ? matchState.teamA.name : matchState.teamB.name} can only substitute a maximum of 5 players`);
            return;
        }
        
        const newSubFields = createSubstitutionFields();
        document.getElementById('additionalSubsContainer').appendChild(newSubFields);
    }

    function closeSubstitutionDialog() {
        subModal.style.display = 'none';
        if (!currentSubContext.windowToEdit && !currentSubContext.isHalfTime) {
            const team = currentSubContext.isTeamA ? 'teamA' : 'teamB';
            if (matchState.activeSubWindow[team]) {
                matchState.activeSubWindow[team] = false;
                updateSubstitutionButtonsState();
            }
        }
    }

    function saveSubstitutionEvent() {
        const playerIn = playerInInput.value.trim();
        const playerOut = playerOutInput.value.trim();
        if (!playerIn || !playerOut) {
            alert('Please enter both player in and player out numbers');
            return;
        }
        
        const { isTeamA, isHalfTime, windowToEdit } = currentSubContext;
        const team = isTeamA ? 'teamA' : 'teamB';
        
        // Check max player substitutions (5 players)
        const currentCount = getPlayerSubCount(isTeamA);
        const additionalFields = document.querySelectorAll('#additionalSubsContainer .substitution-fields').length;
        
        // If editing, don't count the existing substitutions
        let editingCount = 0;
        if (windowToEdit) {
            if (isHalfTime || (document.querySelector(`.event-card[data-id="${windowToEdit}"][data-half-time="true"]`))) {
                editingCount = matchState[team].halfTimeSubstitutions.filter(
                    sub => sub.windowId === windowToEdit || sub.id === windowToEdit
                ).length;
            } else {
                editingCount = matchState[team].substitutions.filter(
                    sub => sub.windowId === windowToEdit || sub.id === windowToEdit
                ).length;
            }
        }
        
        // Check if adding these would exceed the limit
        if (currentCount - editingCount + additionalFields + 1 > 5) {
            alert(`${isTeamA ? matchState.teamA.name : matchState.teamB.name} can only substitute a maximum of 5 players`);
            return;
        }
        
        // Determine time stamp
        let currentTimeStamp;
        if (windowToEdit) {
            if (isHalfTime || (document.querySelector(`.event-card[data-id="${windowToEdit}"][data-half-time="true"]`))) {
                // Get timestamp from existing half-time sub
                currentTimeStamp = (isTeamA ? matchState.teamA.halfTimeSubstitutions : matchState.teamB.halfTimeSubstitutions)
                    .find(sub => sub.windowId === windowToEdit || sub.id === windowToEdit)?.timeStamp || "Half-time";
            } else {
                // Get timestamp from existing regular sub
                currentTimeStamp = (isTeamA ? matchState.teamA.substitutions : matchState.teamB.substitutions)
                    .find(sub => sub.windowId === windowToEdit || sub.id === windowToEdit)?.timeStamp || matchState.elapsedTime;
            }
        } else {
            // New substitution
            currentTimeStamp = isHalfTime ? "Half-time" : 
                (matchState.isInjuryTimeActive ? 
                    `${matchState.elapsedTime} ${matchState.currentInjuryTimeDisplay}` : 
                    matchState.elapsedTime);
        }
        
        const windowId = windowToEdit || Date.now().toString();
        const substitutions = [];
        
        substitutions.push({
            id: Date.now().toString() + '-1',
            playerInNumber: playerIn,
            playerOutNumber: playerOut,
            timeStamp: currentTimeStamp,
            windowId: windowId,
            isHalfTime: isHalfTime
        });
        
                    const additionalSubsContainer = document.getElementById('additionalSubsContainer');
        if (additionalSubsContainer) {
            const additionalFields = additionalSubsContainer.querySelectorAll('.substitution-fields');
            additionalFields.forEach((field, index) => {
                const addPlayerIn = field.querySelector('.player-in').value.trim();
                const addPlayerOut = field.querySelector('.player-out').value.trim();
                if (addPlayerIn && addPlayerOut) {
                    substitutions.push({
                        id: Date.now().toString() + `-${index + 2}`,
                        playerInNumber: addPlayerIn,
                        playerOutNumber: addPlayerOut,
                        timeStamp: currentTimeStamp,
                        windowId: windowId,
                        isHalfTime: isHalfTime
                    });
                }
            });
        }
        
        if (windowToEdit) {
            if (isHalfTime || (document.querySelector(`.event-card[data-id="${windowToEdit}"][data-half-time="true"]`))) {
                // Editing half-time substitutions
                const newSubsList = (isTeamA ? matchState.teamA.halfTimeSubstitutions : matchState.teamB.halfTimeSubstitutions)
                    .filter(sub => sub.windowId !== windowToEdit && sub.id !== windowToEdit);
                if (isTeamA) matchState.teamA.halfTimeSubstitutions = [...newSubsList, ...substitutions];
                else matchState.teamB.halfTimeSubstitutions = [...newSubsList, ...substitutions];
            } else {
                // Editing regular substitutions
                const newSubsList = (isTeamA ? matchState.teamA.substitutions : matchState.teamB.substitutions)
                    .filter(sub => sub.windowId !== windowToEdit && sub.id !== windowToEdit);
                if (isTeamA) matchState.teamA.substitutions = [...newSubsList, ...substitutions];
                else matchState.teamB.substitutions = [...newSubsList, ...substitutions];
            }
        } else {
            // Adding new substitutions
            if (isHalfTime) {
                // Add to half-time substitutions
                if (isTeamA) matchState.teamA.halfTimeSubstitutions = [...matchState.teamA.halfTimeSubstitutions, ...substitutions];
                else matchState.teamB.halfTimeSubstitutions = [...matchState.teamB.halfTimeSubstitutions, ...substitutions];
            } else {
                // Add to regular substitutions and increment window count
                matchState[team].subWindows++;
                if (isTeamA) matchState.teamA.substitutions = [...matchState.teamA.substitutions, ...substitutions];
                else matchState.teamB.substitutions = [...matchState.teamB.substitutions, ...substitutions];
                matchState.activeSubWindow[team] = false;
            }
        }
        
        renderTeamSubstitutions();
        updateSubstitutionButtonsState();
        saveMatchData();
        subModal.style.display = 'none';
    }

    function deleteSubstitutionWindow() {
        const { isTeamA, isHalfTime, windowToEdit } = currentSubContext;
        if (!windowToEdit) return;
        
        if (isHalfTime || (document.querySelector(`.event-card[data-id="${windowToEdit}"][data-half-time="true"]`))) {
            // Deleting a half-time sub window
            const team = isTeamA ? matchState.teamA : matchState.teamB;
            team.halfTimeSubstitutions = team.halfTimeSubstitutions.filter(
                sub => sub.windowId !== windowToEdit && sub.id !== windowToEdit
            );
        } else {
            // Deleting a regular sub window
            const team = isTeamA ? matchState.teamA : matchState.teamB;
            const subsInWindow = team.substitutions.filter(
                sub => sub.windowId === windowToEdit || sub.id === windowToEdit
            );
            team.substitutions = team.substitutions.filter(
                sub => sub.windowId !== windowToEdit && sub.id !== windowToEdit
            );
            if (subsInWindow.length > 0) team.subWindows = Math.max(0, team.subWindows - 1);
        }
        
        renderTeamSubstitutions();
        updateSubstitutionButtonsState();
        saveMatchData();
        subModal.style.display = 'none';
    }

    function showResetConfirmDialog() {
        resetConfirmModal.style.display = 'flex';
    }

    function resetAllData() {
        clearInterval(matchTimer);
        clearInterval(injuryTimer);
        matchState = {
            isMatchStarted: false,
            isFirstHalf: true,
            isHalfTime: false,
            startTime: null,
            elapsedTime: "00:00",
            currentHalfTime: 45 * 60, // 45 minutes in seconds
            teamA: {
                name: "Team A",
                color: "#1976D2",
                cards: [],
                substitutions: [],
                halfTimeSubstitutions: [],
                subWindows: 0,
                playerCount: 0,
                goals: 0
            },
            teamB: {
                name: "Team B",
                color: "#D32F2F",
                cards: [],
                substitutions: [],
                halfTimeSubstitutions: [],
                subWindows: 0,
                playerCount: 0,
                goals: 0
            },
            isInjuryTimeActive: false,
            isAddingInjuryTime: false,
            remainingInjuryTime: 0,
            totalInjurySeconds: 0,
            injuryTimePeriods: [],
            currentInjuryStartTime: null,
            currentInjuryTimeDisplay: "+00:00",
            activeSubWindow: {
                teamA: false,
                teamB: false
            }
        };
        clearMatchData();
        updateUI();
        resetConfirmModal.style.display = 'none';
    }

   function endMatch() {
    if (!matchState.isMatchStarted && !matchState.isAddingInjuryTime) {
        alert('There is no match to end');
        return;
    }
    clearInterval(matchTimer);
    clearInterval(injuryTimer);
    if (matchState.isInjuryTimeActive) toggleInjuryTime();
    
    // Lock at 90:00 if we're in the second half
    if (!matchState.isFirstHalf) {
        matchState.elapsedTime = "4:00"; // เปลี่ยนเป็น 90:00 ในเกมจริง
    }
    
    matchState.isMatchStarted = false;
    matchState.isAddingInjuryTime = false;
    
    // ซ่อนปุ่ม Injury Time เมื่อจบการแข่งขัน
    injuryBtn.style.display = 'none';
    injuryFab.style.display = 'none';
    
    updateUI();
    saveMatchData();
    showMatchSummary();
}

    function showMatchSummary() {
        const teamA = matchState.teamA;
        const teamB = matchState.teamB;
        const teamAYellowCards = teamA.cards.filter(card => card.isYellow).length;
        const teamARedCards = teamA.cards.filter(card => !card.isYellow && !card.isGoal).length;
        const teamAGoals = teamA.goals;
        const teamBYellowCards = teamB.cards.filter(card => card.isYellow).length;
        const teamBRedCards = teamB.cards.filter(card => !card.isYellow && !card.isGoal).length;
        const teamBGoals = teamB.goals;
        
        // Include both regular substitutions and half-time substitutions
        const teamAAllSubs = [...teamA.substitutions, ...teamA.halfTimeSubstitutions.map(sub => ({...sub, isHalfTime: true}))];
        const teamBAllSubs = [...teamB.substitutions, ...teamB.halfTimeSubstitutions.map(sub => ({...sub, isHalfTime: true}))];
        
        const teamASubWindows = groupSubstitutionsByWindow(teamAAllSubs);
        const teamBSubWindows = groupSubstitutionsByWindow(teamBAllSubs);
        
        const totalMatchTime = matchState.elapsedTime;
        const totalInjuryTime = getTotalInjuryTimeDisplay();
        
        const teamAPlayerSubCount = getPlayerSubCount(true);
        const teamBPlayerSubCount = getPlayerSubCount(false);

        let summaryHTML = `
            <div style="margin-bottom: 16px;">
                <h3 style="margin-bottom: 8px;">Match Duration</h3>
                <p>Match Time: ${totalMatchTime}</p>
                <p>Total Injury Time: ${totalInjuryTime}</p>
            </div>
            <div style="margin-bottom: 16px;">
                <h3 style="margin-bottom: 8px;">${teamA.name}</h3>
                <p>Goals: ${teamAGoals}</p>
                <p>Yellow Cards: ${teamAYellowCards}</p>
                <p>Red Cards: ${teamARedCards}</p>
                <p>Substitution Windows: ${teamA.subWindows}/3 (${teamAPlayerSubCount}/5 Players)</p>
                ${teamA.cards.length > 0 ? `
                    <div style="margin-top: 8px;">
                        <p>Event Details:</p>
                        ${teamA.cards.map(card => `
                            <p style="margin-left: 16px;">- ${card.isGoal ? 'Goal' : (card.isYellow ? 'Yellow Card' : 'Red Card')} #${card.playerNumber} (${card.timeStamp})</p>
                        `).join('')}
                    </div>
                ` : ''}
                ${teamASubWindows.length > 0 ? `
                    <div style="margin-top: 8px;">
                        <p>Substitution Details:</p>
                        ${teamASubWindows.map((window, index) => `
                            <p style="margin-left: 16px;">- ${window.isHalfTime ? 'Half-time Substitution' : `Window ${index + 1}`} (${window.timeStamp}):</p>
                            ${window.substitutions.map(sub => `
                                <p style="margin-left: 32px;">#${sub.playerInNumber} In, #${sub.playerOutNumber} Out</p>
                            `).join('')}
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div>
                <h3 style="margin-bottom: 8px;">${teamB.name}</h3>
                <p>Goals: ${teamBGoals}</p>
                <p>Yellow Cards: ${teamBYellowCards}</p>
                <p>Red Cards: ${teamBRedCards}</p>
                <p>Substitution Windows: ${teamB.subWindows}/3 (${teamBPlayerSubCount}/5 Players)</p>
                ${teamB.cards.length > 0 ? `
                    <div style="margin-top: 8px;">
                        <p>Event Details:</p>
                        ${teamB.cards.map(card => `
                            <p style="margin-left: 16px;">- ${card.isGoal ? 'Goal' : (card.isYellow ? 'Yellow Card' : 'Red Card')} #${card.playerNumber} (${card.timeStamp})</p>
                        `).join('')}
                    </div>
                ` : ''}
                ${teamBSubWindows.length > 0 ? `
                    <div style="margin-top: 8px;">
                        <p>Substitution Details:</p>
                        ${teamBSubWindows.map((window, index) => `
                            <p style="margin-left: 16px;">- ${window.isHalfTime ? 'Half-time Substitution' : `Window ${index + 1}`} (${window.timeStamp}):</p>
                            ${window.substitutions.map(sub => `
                                <p style="margin-left: 32px;">#${sub.playerInNumber} In, #${sub.playerOutNumber} Out</p>
                            `).join('')}
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;

        matchSummaryContent.innerHTML = summaryHTML;
        matchSummaryModal.style.display = 'flex';
    }

    function saveSummaryAsPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text("Match Summary", 105, 10, { align: "center" });
        
        const teamA = matchState.teamA;
        const teamB = matchState.teamB;
        const teamAYellowCards = teamA.cards.filter(card => card.isYellow).length;
        const teamARedCards = teamA.cards.filter(card => !card.isYellow && !card.isGoal).length;
        const teamAGoals = teamA.goals;
        const teamBYellowCards = teamB.cards.filter(card => card.isYellow).length;
        const teamBRedCards = teamB.cards.filter(card => !card.isYellow && !card.isGoal).length;
        const teamBGoals = teamB.goals;
        
        // Include both regular substitutions and half-time substitutions
        const teamAAllSubs = [...teamA.substitutions, ...teamA.halfTimeSubstitutions.map(sub => ({...sub, isHalfTime: true}))];
        const teamBAllSubs = [...teamB.substitutions, ...teamB.halfTimeSubstitutions.map(sub => ({...sub, isHalfTime: true}))];
        
        const teamASubWindows = groupSubstitutionsByWindow(teamAAllSubs);
        const teamBSubWindows = groupSubstitutionsByWindow(teamBAllSubs);
        
        const teamAPlayerSubCount = getPlayerSubCount(true);
        const teamBPlayerSubCount = getPlayerSubCount(false);
        
        let yPos = 20;
        
        doc.setFontSize(14);
        doc.text("Match Duration", 10, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Match Time: ${matchState.elapsedTime}`, 10, yPos);
        yPos += 7;
        doc.text(`Total Injury Time: ${getTotalInjuryTimeDisplay()}`, 10, yPos);
        yPos += 10;
        
        doc.setFontSize(14);
        doc.text(teamA.name, 10, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Goals: ${teamAGoals}`, 10, yPos);
        yPos += 7;
        doc.text(`Yellow Cards: ${teamAYellowCards}`, 10, yPos);
        yPos += 7;
        doc.text(`Red Cards: ${teamARedCards}`, 10, yPos);
        yPos += 7;
        doc.text(`Substitution Windows: ${teamA.subWindows}/3 (${teamAPlayerSubCount}/5 Players)`, 10, yPos);
        yPos += 7;
        
        if (teamA.cards.length > 0) {
            yPos += 5;
            doc.text("Event Details:", 10, yPos);
            yPos += 7;
            teamA.cards.forEach(card => {
                doc.text(`- ${card.isGoal ? 'Goal' : (card.isYellow ? 'Yellow Card' : 'Red Card')} #${card.playerNumber} (${card.timeStamp})`, 15, yPos);
                yPos += 7;
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 10;
                }
            });
        }
        
        if (teamASubWindows.length > 0) {
            yPos += 5;
            doc.text("Substitution Details:", 10, yPos);
            yPos += 7;
            teamASubWindows.forEach((window, index) => {
                const windowTitle = window.isHalfTime ? 'Half-time Substitution' : `Window ${index + 1}`;
                doc.text(`- ${windowTitle} (${window.timeStamp}):`, 15, yPos);
                yPos += 7;
                window.substitutions.forEach(sub => {
                    doc.text(`  #${sub.playerInNumber} In, #${sub.playerOutNumber} Out`, 20, yPos);
                    yPos += 7;
                    if (yPos > 280) {
                        doc.addPage();
                        yPos = 10;
                    }
                });
            });
        }
        
        yPos += 10;
        
        doc.setFontSize(14);
        doc.text(teamB.name, 10, yPos);
        yPos += 10;
        doc.setFontSize(12);
        doc.text(`Goals: ${teamBGoals}`, 10, yPos);
        yPos += 7;
        doc.text(`Yellow Cards: ${teamBYellowCards}`, 10, yPos);
        yPos += 7;
        doc.text(`Red Cards: ${teamBRedCards}`, 10, yPos);
        yPos += 7;
        doc.text(`Substitution Windows: ${teamB.subWindows}/3 (${teamBPlayerSubCount}/5 Players)`, 10, yPos);
        yPos += 7;
        
        if (teamB.cards.length > 0) {
            yPos += 5;
            doc.text("Event Details:", 10, yPos);
            yPos += 7;
            teamB.cards.forEach(card => {
                doc.text(`- ${card.isGoal ? 'Goal' : (card.isYellow ? 'Yellow Card' : 'Red Card')} #${card.playerNumber} (${card.timeStamp})`, 15, yPos);
                yPos += 7;
                if (yPos > 280) {
                    doc.addPage();
                    yPos = 10;
                }
            });
        }
        
        if (teamBSubWindows.length > 0) {
            yPos += 5;
            doc.text("Substitution Details:", 10, yPos);
            yPos += 7;
            teamBSubWindows.forEach((window, index) => {
                const windowTitle = window.isHalfTime ? 'Half-time Substitution' : `Window ${index + 1}`;
                doc.text(`- ${windowTitle} (${window.timeStamp}):`, 15, yPos);
                yPos += 7;
                window.substitutions.forEach(sub => {
                    doc.text(`  #${sub.playerInNumber} In, #${sub.playerOutNumber} Out`, 20, yPos);
                    yPos += 7;
                    if (yPos > 280) {
                        doc.addPage();
                        yPos = 10;
                    }
                });
            });
        }
        
        doc.save(`Match_Summary_${new Date().toISOString().slice(0,10)}.pdf`);
    }

    // Global functions for event handling
    window.editCard = function(cardId, isTeamA) {
        const card = isTeamA 
            ? matchState.teamA.cards.find(c => c.id === cardId)
            : matchState.teamB.cards.find(c => c.id === cardId);
        if (card) showCardDialog(isTeamA, card.isYellow, card.isGoal, card);
    };

    window.editSubstitutionWindow = function(windowId, isTeamA, isHalfTime) {
        showSubstitutionDialog(isTeamA, isHalfTime, windowId);
    };

    init();
});
