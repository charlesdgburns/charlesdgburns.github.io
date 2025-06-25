// Game state
        let gameState = {
            players: [],
            roles: [],
            currentPhase: 'setup',
            nightNumber: 0,
            dayNumber: 0,
            currentPlayerIndex: 0,
            alivePlayers: [],
            deaths: [],
            votes: {},
            nightActions: {},
            lovers: [],
            hunterRevengeQueue: [],
            passQueue: [],
            isVoting: false,
            discussionTimer: null,
            lastDoctorSave: null,
            previousNightDoctorSave: null,
            availableRoles: {
                'Alpha Werewolf': { count: 0, max: 1 },
                'Beta Werewolf': { count: 0, max: 10 },
                'Villager': { count: 0, max: 10 },
                'Doctor': { count: 0, max: 1 },
                'Seer': { count: 0, max: 1 },
                'Hunter': { count: 0, max: 10 },
                'Cupid': { count: 0, max: 1 },
                'Joker': { count: 0, max: 1 }
            }
        };

        // Role descriptions and actions
        const roleInfo = {
            'Alpha Werewolf': {
                description: 'You can kill one player each night. You know who the other werewolves are.',
                team: 'werewolf',
                nightAction: true
            },
            'Beta Werewolf': {
                description: 'You know who the other werewolves are, but cannot kill.',
                team: 'werewolf',
                nightAction: false
            },
            'Villager': {
                description: 'You have no special abilities. Help the town find the werewolves!',
                team: 'town',
                nightAction: false
            },
            'Doctor': {
                description: 'You can save one player each night from werewolf attacks.',
                team: 'town',
                nightAction: true
            },
            'Seer': {
                description: 'You can learn the team (town/werewolf) of one player each night.',
                team: 'town',
                nightAction: true
            },
            'Hunter': {
                description: 'When you die, you can kill one other player.',
                team: 'town',
                nightAction: false
            },
            'Cupid': {
                description: 'On the first night, you choose two players to fall in love.',
                team: 'town',
                nightAction: true
            },
            'Joker': {
                description: 'You win if you are burned at the stake, otherwise you win with the town.',
                team: 'town',
                nightAction: false
            }
        };

        function addPlayer() {
            const nameInput = document.getElementById('player-name');
            const name = nameInput.value.trim();
            
            if (name && !gameState.players.includes(name)) {
                gameState.players.push(name);
                nameInput.value = '';
                updatePlayersList();
                
                if (gameState.players.length >= 3) {
                    document.getElementById('role-setup').classList.remove('hidden');
                    setupRoleSelection();
                }
            }
        }

        function updatePlayersList() {
            const list = document.getElementById('players-list');
            list.innerHTML = gameState.players.map((player, index) => 
                `<div>${player} <button class="minimal-btn" onclick="removePlayer(${index})">Remove</button></div>`
            ).join('');
        }

        function removePlayer(index) {
            gameState.players.splice(index, 1);
            updatePlayersList();
            if (gameState.players.length < 3) {
                document.getElementById('role-setup').classList.add('hidden');
            } else {
                setupRoleSelection();
            }
        }

        function setupRoleSelection() {
            const container = document.getElementById('roles-config');
            container.innerHTML = '';
            
            Object.keys(gameState.availableRoles).forEach(role => {
                const div = document.createElement('div');
                div.className = 'role-selection';
                div.innerHTML = `
                    <label>${role}</label>
                    <input type="number" class="role-count" min="0" max="${gameState.availableRoles[role].max}" 
                           value="${gameState.availableRoles[role].count}" 
                           onchange="updateRoleCount('${role}', this.value)">
                `;
                container.appendChild(div);
            });
            
            updateRoleCountInfo();
        }

        function updateRoleCount(role, count) {
            gameState.availableRoles[role].count = parseInt(count) || 0;
            updateRoleCountInfo();
        }

        function updateRoleCountInfo() {
            const totalRoles = Object.values(gameState.availableRoles).reduce((sum, role) => sum + role.count, 0);
            const info = document.getElementById('role-count-info');
            info.textContent = `Players: ${gameState.players.length}, Roles: ${totalRoles}`;
            
            if (totalRoles > gameState.players.length) {
                info.style.color = '#ff4444';
                info.textContent += ' (Too many roles!)';
            } else if (totalRoles < gameState.players.length) {
                info.style.color = '#ff4444';
                info.textContent += ' (Not enough roles!)';
            } else {
                info.style.color = 'inherit';
            }
        }

        function startGame() {
            const totalRoles = Object.values(gameState.availableRoles).reduce((sum, role) => sum + role.count, 0);

            if (totalRoles !== gameState.players.length) {
                alert('Number of roles must equal number of players!');
                return;
            }

            if (!gameState.availableRoles['Alpha Werewolf'].count && gameState.availableRoles['Beta Werewolf'].count) {
                alert('You need at least one Alpha Werewolf if you have Beta Werewolves!');
                return;
            }

            assignRoles();
            localStorage.setItem('werewolfPlayers', JSON.stringify(gameState.players));
            localStorage.setItem('werewolfRoles', JSON.stringify(gameState.availableRoles));

            gameState.alivePlayers = [...gameState.players];
            
            gameState.currentPhase = 'night';
            gameState.nightNumber = 1;

            document.getElementById('setup-phase').classList.add('hidden');
            document.getElementById('game-phase').classList.remove('hidden');
            document.querySelector('.phase-title').textContent = 'Night Phase 1';
            if (checkWinConditions()) return;

            startNight();
        }


        function assignRoles() {
            const roles = [];
            Object.entries(gameState.availableRoles).forEach(([role, config]) => {
                for (let i = 0; i < config.count; i++) {
                    roles.push(role);
                }
            });
            
            // Shuffle roles
            for (let i = roles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [roles[i], roles[j]] = [roles[j], roles[i]];
            }
            
            gameState.roles = roles;
        }

        function startNight() {
            document.body.className = 'night-theme';
            document.querySelector('.phase-title').textContent = `Night Phase ${gameState.nightNumber}`;
            document.getElementById('day-phase').classList.add('hidden');
            document.getElementById('voting-phase').classList.add('hidden');
            document.getElementById('night-passing').classList.remove('hidden');
            
            document.getElementById('night-number').textContent = gameState.nightNumber;
            
            // Reset night actions
            gameState.nightActions = {};
            
            // Determine pass order (cupid first on night 1, then all players)
            setupNightPassOrder();
            
            gameState.currentPlayerIndex = 0;
            showPassScreen();
        }

        function setupNightPassOrder() {
            gameState.passQueue = [];

            if (gameState.nightNumber === 1) {
                const allAliveIndices = gameState.alivePlayers.map(name => gameState.players.indexOf(name)).filter(i => i !== -1);
                gameState.passQueue.push({ phase: 'cupid', players: allAliveIndices });
                gameState.passQueue.push({ phase: 'normal', players: allAliveIndices });
            } else {
                const allAliveIndices = gameState.alivePlayers.map(name => gameState.players.indexOf(name)).filter(i => i !== -1);
                gameState.passQueue.push({ phase: 'normal', players: allAliveIndices });
            }
        }

        function showPassScreen() {
            if (gameState.passQueue.length === 0) {
                endNight();
                return;
            }
            
            if (gameState.currentPlayerIndex >= gameState.passQueue[0].players.length) {
                // Move to next phase or end night
                gameState.passQueue.shift();
                gameState.currentPlayerIndex = 0;
                
                if (gameState.passQueue.length === 0) {
                    endNight();
                    return;
                }
            }
            
            document.getElementById('pass-screen').classList.remove('hidden');
            document.getElementById('player-screen').classList.add('hidden');
            
            const currentPlayerIndex = gameState.passQueue[0].players[gameState.currentPlayerIndex];
            const playerName = gameState.players[currentPlayerIndex];
            document.getElementById('pass-to-name').textContent = playerName;
        }

        function showPlayerScreen() {
            document.getElementById('pass-screen').classList.add('hidden');
            document.getElementById('player-screen').classList.remove('hidden');
            
            const currentPlayerIndex = gameState.passQueue[0].players[gameState.currentPlayerIndex];
            const playerName = gameState.players[currentPlayerIndex];
            const playerRole = gameState.roles[currentPlayerIndex];
            
            document.getElementById('current-player-name').textContent = playerName;
            document.getElementById('current-player-role').textContent = playerRole;
            
            // Show role description and special info
            let description = roleInfo[playerRole].description;
            
            // Add werewolf team info
            if (roleInfo[playerRole].team === 'werewolf') {
                const werewolves = getWerewolves().filter(w => w !== playerName);
                if (werewolves.length > 0) {
                    description += `<br><br><strong>Other werewolves:</strong> ${werewolves.join(', ')}`;
                }
                
                // Show unassigned roles if Alpha
                if (playerRole === 'Alpha Werewolf') {
                    const unassignedRoles = getUnassignedRoles();
                    if (unassignedRoles.length > 0) {
                        description += `<br><br><strong>Unassigned roles:</strong> ${unassignedRoles.join(', ')}`;
                    }
                }
            }
            
            // Show lover info
            if (gameState.lovers.includes(playerName) && gameState.passQueue[0].phase !== 'cupid' ) {
                const lover = gameState.lovers.find(l => l !== playerName);
                if (lover && gameState.alivePlayers.includes(lover)) {
                    description += `<br><br><strong>Your lover:</strong> ${lover}`;
                }
            }
            
            document.getElementById('role-description').innerHTML = description;
            
            // Setup actions
            setupPlayerActions(currentPlayerIndex, playerRole);
        }

        function setupPlayerActions(playerIndex, role) {
            const actionsDiv = document.getElementById('player-actions');
            const currentPhase = gameState.passQueue[0].phase;

            actionsDiv.innerHTML = '';

            if (currentPhase === 'cupid' && role !== 'Cupid') {
                actionsDiv.innerHTML = '<p>This is an intro: remember your character!</p>';
                document.getElementById('player-confirm').disabled = false;
                return;
            }

            if (currentPhase === 'cupid' && role === 'Cupid') {
                actionsDiv.innerHTML = `
                    <h4>Choose two players to fall in love:</h4>
                    <div id="lover-selection"></div>
                `;
                setupLoverSelection();
                return;
            }

            // Normal night actions
            switch (role) {
                case 'Alpha Werewolf':
                    setupKillSelection();
                    break;
                case 'Doctor':
                    setupSaveSelection();
                    break;
                case 'Seer':
                    setupSeerSelection();
                    break;
                default:
                    actionsDiv.innerHTML = '<p>Sleep tight.</p>';
                    document.getElementById('player-confirm').disabled = false;
            }
        }

        function setupLoverSelection() {
            const container = document.getElementById('lover-selection');
            container.innerHTML = gameState.players.map((player, index) => 
                `<label><input type="checkbox" value="${index}" onchange="updateLoverSelection()"> ${player}</label><br>`
            ).join('');
        }

        function updateLoverSelection() {
            const checkboxes = document.querySelectorAll('#lover-selection input[type="checkbox"]:checked');
            document.getElementById('player-confirm').disabled = checkboxes.length !== 2;
        }

        function setupKillSelection() {
            const actionsDiv = document.getElementById('player-actions');
            const targets = gameState.alivePlayers.filter(p => p !== gameState.players[gameState.passQueue[0].players[gameState.currentPlayerIndex]]);
            
            actionsDiv.innerHTML = `
                <h4>Choose someone to kill:</h4>
                <select id="kill-target">
                    <option value="">Select target</option>
                    ${targets.map(player => `<option value="${player}">${player}</option>`).join('')}
                </select>
            `;
            
            document.getElementById('kill-target').onchange = function() {
                document.getElementById('player-confirm').disabled = !this.value;
            };
        }

        function setupSaveSelection() {
            const actionsDiv = document.getElementById('player-actions');
            
            // Filter out the player saved last night (if any)
            const options = gameState.alivePlayers.filter(p => 
                !gameState.previousNightDoctorSave || p !== gameState.previousNightDoctorSave
            );
            
            actionsDiv.innerHTML = `
                <h4>Choose someone to save:</h4>
                <select id="save-target">
                    <option value="">Select target</option>
                    ${options.map(player => `<option value="${player}">${player}</option>`).join('')}
                </select>
            `;
            
            // Show restriction note if applicable
            if (gameState.previousNightDoctorSave) {
                actionsDiv.innerHTML += `
                    <div class="restriction-note">
                        Note: You cannot save ${gameState.previousNightDoctorSave} again (same person twice in a row)
                    </div>
                `;
            }
            
            document.getElementById('save-target').onchange = function() {
                document.getElementById('player-confirm').disabled = !this.value;
            };
        }

        function setupSeerSelection() {
            const actionsDiv = document.getElementById('player-actions');
            const targets = gameState.alivePlayers.filter(p => p !== gameState.players[gameState.passQueue[0].players[gameState.currentPlayerIndex]]);

            actionsDiv.innerHTML = `
                <h4>Choose someone to investigate:</h4>
                <select id="seer-target">
                    <option value="">Select target</option>
                    ${targets.map(player => `<option value="${player}">${player}</option>`).join('')}
                </select>
                <div id="seer-result"></div>
            `;

            document.getElementById('seer-target').onchange = function () {
                document.getElementById('player-confirm').disabled = !this.value;
            };
        }

        function confirmPlayerAction() {
            const currentPlayerIndex = gameState.passQueue[0].players[gameState.currentPlayerIndex];
            const playerRole = gameState.roles[currentPlayerIndex];
            const currentPhase = gameState.passQueue[0].phase;

            if (currentPhase === 'cupid') {
                if (playerRole !== 'Cupid') {
                    gameState.currentPlayerIndex++;
                    showPassScreen();
                    return;
                }
                const selected = Array.from(document.querySelectorAll('#lover-selection input[type="checkbox"]:checked'))
                    .map(cb => gameState.players[parseInt(cb.value)]);
                gameState.lovers = selected;
                gameState.nightActions.cupid = selected;
            } else {
                switch (playerRole) {
                    case 'Alpha Werewolf':
                        const killTarget = document.getElementById('kill-target').value;
                        if (killTarget) gameState.nightActions.kill = killTarget;
                        break;
                    case 'Doctor':
                        const saveTarget = document.getElementById('save-target').value;
                        if (saveTarget) {
                            gameState.nightActions.save = saveTarget;
                            gameState.lastDoctorSave = saveTarget; // Track this night's save
                        }
                        break;
                    case 'Seer':
                        const seerTarget = document.getElementById('seer-target').value;
                        if (seerTarget) {
                            const targetIndex = gameState.players.indexOf(seerTarget);
                            const targetRole = gameState.roles[targetIndex];
                            const team = roleInfo[targetRole].team;
                            document.getElementById('seer-modal-text').textContent =
                                `${seerTarget} is on the ${team} team.`;
                            document.getElementById('seer-modal').classList.remove('hidden');
                            gameState.deferAfterSeerModal = () => {
                                gameState.currentPlayerIndex++;
                                showPassScreen();
                            };
                            return;
                        }
                        break;
                }
            }

            gameState.currentPlayerIndex++;
            showPassScreen();
        }


        function endNight() {
            // Process night actions
            const deaths = [];
            
            // Process werewolf kill
            if (gameState.nightActions.kill) {
                const victim = gameState.nightActions.kill;
                // Check if doctor saved them
                if (!gameState.nightActions.save || gameState.nightActions.save !== victim) {
                    deaths.push(victim);
                }
            }
            
            // Process lover deaths
            deaths.forEach(victim => {
                if (gameState.lovers.includes(victim)) {
                    const lover = gameState.lovers.find(l => l !== victim);
                    if (lover && gameState.alivePlayers.includes(lover)) {
                        deaths.push(lover);
                    }
                }
            });
            
            // Remove deaths from alive players
            deaths.forEach(victim => {
                const index = gameState.alivePlayers.indexOf(victim);
                if (index !== -1) {
                    gameState.alivePlayers.splice(index, 1);
                    gameState.deaths.push({ name: victim, cause: 'werewolf', night: gameState.nightNumber });
                }
            });
            
            // Check for hunter revenge (night deaths)
            deaths.forEach(victim => {
                const victimIndex = gameState.players.indexOf(victim);
                if (gameState.roles[victimIndex] === 'Hunter') {
                    gameState.hunterRevengeQueue.push(victim);
                }
            });
            
            // Handle beta werewolf promotion
            handleWerewolfPromotion();
            
            // Update doctor save restriction for next night
            gameState.previousNightDoctorSave = gameState.lastDoctorSave;
            gameState.lastDoctorSave = null;
            
            startDay();
        }

        function handleWerewolfPromotion() {
            const alphaIndex = gameState.roles.indexOf('Alpha Werewolf');
            if (alphaIndex !== -1 && !gameState.alivePlayers.includes(gameState.players[alphaIndex])) {
                // Alpha is dead, promote a beta
                const betaIndices = gameState.roles.map((role, index) => role === 'Beta Werewolf' ? index : -1)
                    .filter(index => index !== -1 && gameState.alivePlayers.includes(gameState.players[index]));
                
                if (betaIndices.length > 0) {
                    const newAlphaIndex = betaIndices[Math.floor(Math.random() * betaIndices.length)];
                    gameState.roles[newAlphaIndex] = 'Alpha Werewolf';
                }
            }
        }

        function startDay() {
            document.body.className = 'day-theme';
            document.querySelector('.phase-title').textContent = `Day Phase ${gameState.nightNumber}`;
            document.getElementById('night-passing').classList.add('hidden');
            document.getElementById('day-phase').classList.remove('hidden');
            
            gameState.dayNumber = gameState.nightNumber;
            document.getElementById('day-number').textContent = gameState.dayNumber;
            
            // Show day summary
            showDaySummary();
            
            // Check for hunter revenge
            if (gameState.hunterRevengeQueue.length > 0) {
                showHunterRevenge();
            } else {
                startDiscussion();
            }
        }

        function showDaySummary() {
            const summaryDiv = document.getElementById('day-summary');
            const nightDeaths = gameState.deaths.filter(d => d.night === gameState.nightNumber);
            
            if (nightDeaths.length === 0) {
                summaryDiv.innerHTML = '<p>No one died during the night.</p>';
            logEvent(`Night ${gameState.nightNumber}: No one died.`);
            } else {
                logEvent(`Night ${gameState.nightNumber}: ${nightDeaths.map(d => d.name + ' died').join(', ')}.`);
            summaryDiv.innerHTML = `<p><strong>Deaths during the night:</strong></p>` +
                    nightDeaths.map(death => `<p>${death.name} was killed by ${death.cause}</p>`).join('');
            }
        }

        function showHunterRevenge() {
            document.getElementById('day-discussion').classList.add('hidden');
            document.getElementById('hunter-revenge').classList.remove('hidden');
            
            const hunter = gameState.hunterRevengeQueue[0];
            document.getElementById('hunter-name').textContent = hunter;
            
            const targetsDiv = document.getElementById('hunter-targets');
            targetsDiv.innerHTML = `
                <select id="hunter-target">
                    <option value="">Select target</option>
                    ${gameState.alivePlayers.map(player => `<option value="${player}">${player}</option>`).join('')}
                </select>
            `;
            
            document.getElementById('hunter-target').onchange = function() {
                document.getElementById('confirm-hunter-kill').disabled = !this.value;
            };
            document.getElementById('confirm-hunter-kill').disabled = true;
        }

        function confirmHunterKill() {
            const target = document.getElementById('hunter-target').value;
            if (!target) {
                alert("Please select a target.");
                return;
            }

            logEvent(`${gameState.hunterRevengeQueue[0]} shot ${target} as hunter's revenge.`);
            const index = gameState.alivePlayers.indexOf(target);
            if (index !== -1) {
                gameState.alivePlayers.splice(index, 1);
                gameState.deaths.push({ name: target, cause: 'hunter revenge', night: gameState.dayNumber });
            }

            const targetIndex = gameState.players.indexOf(target);
            if (gameState.roles[targetIndex] === 'Hunter') {
                gameState.hunterRevengeQueue.push(target);
            }

            if (gameState.lovers.includes(target)) {
                const lover = gameState.lovers.find(l => l !== target);
                if (lover && gameState.alivePlayers.includes(lover)) {
                    const loverIndex = gameState.alivePlayers.indexOf(lover);
                    gameState.alivePlayers.splice(loverIndex, 1);
                    gameState.deaths.push({ name: lover, cause: 'lover suicide', night: gameState.dayNumber });
                }
            }

            gameState.hunterRevengeQueue.shift();
            showDaySummary();

            if (checkWinConditions()) return;

            if (gameState.hunterRevengeQueue.length > 0) {
                showHunterRevenge();
            } else {
                document.getElementById('hunter-revenge').classList.add('hidden');
                setTimeout(startDiscussion, 100);
            }
        }

        function startDiscussion() {
            document.getElementById('day-discussion').classList.remove('hidden');
            
            // Start 5-minute countdown
            let timeLeft = 300; // 5 minutes in seconds
            const timerElement = document.getElementById('discussion-timer');
            timerElement.classList.remove('warning');
            
            gameState.discussionTimer = setInterval(() => {
                const minutes = Math.floor(timeLeft / 60);
                const seconds = timeLeft % 60;
                timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
                
                if (timeLeft <= 30) {
                    timerElement.classList.add('warning');
                }
                
                timeLeft--;
                
                if (timeLeft < 0) {
                    clearInterval(gameState.discussionTimer);
                    timerElement.textContent = "TIME'S UP!";
                    startVoting();
                }
            }, 1000);
        }

        function startVoting() {
            if (gameState.discussionTimer) {
                clearInterval(gameState.discussionTimer);
            }

            if (checkWinConditions()) return;

            document.querySelector('.phase-title').textContent = 'Voting Phase';
            document.getElementById('day-phase').classList.add('hidden');
            document.getElementById('voting-phase').classList.remove('hidden');

            document.getElementById('vote-summary').innerHTML = '';
            document.getElementById('vote-results').classList.add('hidden');
            document.getElementById('vote-hunter-revenge').classList.add('hidden');

            gameState.votes = {};
            gameState.currentPlayerIndex = 0;
            gameState.isVoting = true;

            showVotePassScreen();
        }

        function showVotePassScreen() {
            if (gameState.currentPlayerIndex >= gameState.alivePlayers.length) {
                showVoteResults();
                return;
            }
            
            document.getElementById('vote-pass-screen').classList.remove('hidden');
            document.getElementById('vote-screen').classList.add('hidden');
            
            const currentPlayer = gameState.alivePlayers[gameState.currentPlayerIndex];
            document.getElementById('vote-pass-name').textContent = currentPlayer;
        }

        function showVoteScreen() {
            document.getElementById('vote-pass-screen').classList.add('hidden');
            document.getElementById('vote-screen').classList.remove('hidden');

            const currentPlayer = gameState.alivePlayers[gameState.currentPlayerIndex];
            document.getElementById('voting-player-name').textContent = currentPlayer;

            const optionsDiv = document.getElementById('vote-options');
            const targets = gameState.alivePlayers.filter(p => p !== currentPlayer);

            optionsDiv.innerHTML = targets.map(player =>
                `<div class="vote-option"><label><input type="radio" name="vote" value="${player}"> ${player}</label></div>`
            ).join('');

            // Add Abstain option
            optionsDiv.innerHTML += `<div class="vote-option"><label><input type="radio" name="vote" value="abstain"> Abstain</label></div>`;

            document.querySelectorAll('input[name="vote"]').forEach(radio => {
                radio.onchange = () => {
                    document.getElementById('cast-vote').disabled = false;
                };
            });

            document.getElementById('cast-vote').disabled = true;
        }


        function castVote() {
            const selectedVote = document.querySelector('input[name="vote"]:checked');
            if (!selectedVote) return;
            
            const voter = gameState.alivePlayers[gameState.currentPlayerIndex];
            gameState.votes[voter] = selectedVote.value;
            
            gameState.currentPlayerIndex++;
            showVotePassScreen();
        }

        
        function showVoteResults() {
            document.getElementById('vote-screen').classList.add('hidden');
            document.getElementById('vote-results').classList.remove('hidden');

            const voteCounts = {};
            Object.values(gameState.votes).forEach(vote => {
                if (vote !== 'abstain') {
                    voteCounts[vote] = (voteCounts[vote] || 0) + 1;
                }
            });

            const maxVotes = Math.max(0, ...Object.values(voteCounts));
            const playersWithMaxVotes = Object.keys(voteCounts).filter(player => voteCounts[player] === maxVotes);

            let summaryHTML = '<h4>Vote Count:</h4>';
            Object.entries(voteCounts).forEach(([player, count]) => {
                summaryHTML += `<p>${player}: ${count} vote${count !== 1 ? 's' : ''}</p>`;
            });

            const totalVoters = gameState.alivePlayers.length;
            let burnedPlayer = null;

            if (playersWithMaxVotes.length === 1 && maxVotes > totalVoters / 2) {
                burnedPlayer = playersWithMaxVotes[0];
                summaryHTML += `<p><strong>${burnedPlayer} is burned at the stake!</strong></p>`;
            logEvent(`Day ${gameState.dayNumber}: ${burnedPlayer} was burned at the stake.`);

                const index = gameState.alivePlayers.indexOf(burnedPlayer);
                if (index !== -1) {
                    gameState.alivePlayers.splice(index, 1);
                    gameState.deaths.push({ name: burnedPlayer, cause: 'burned', night: gameState.dayNumber });
                }

                const burnedIndex = gameState.players.indexOf(burnedPlayer);
                if (gameState.roles[burnedIndex] === 'Joker') {
                    endGame('Joker', [burnedPlayer]);
                    return;
                }

                if (gameState.lovers.includes(burnedPlayer)) {
                    const lover = gameState.lovers.find(l => l !== burnedPlayer);
                    if (lover && gameState.alivePlayers.includes(lover)) {
                        const loverIndex = gameState.alivePlayers.indexOf(lover);
                        gameState.alivePlayers.splice(loverIndex, 1);
                        gameState.deaths.push({ name: lover, cause: 'lover suicide', night: gameState.dayNumber });
                        summaryHTML += `<p><strong>${lover} dies of a broken heart!</strong></p>`;
                    }
                }

                if (gameState.roles[burnedIndex] === 'Hunter') {
                    gameState.hunterRevengeQueue.push(burnedPlayer);
                }
            } else {
                summaryHTML += '<p><strong>No one is burned (tie vote, no votes, or no majority).</strong></p>';
            logEvent(`Day ${gameState.dayNumber}: No one was burned.`);
            }

            document.getElementById('vote-summary').innerHTML = summaryHTML;
            
            const continueBtn = document.getElementById('continue-from-vote');
            continueBtn.textContent = 'Continue to Night';
            continueBtn.onclick = continueToNight;

            if (gameState.hunterRevengeQueue.length > 0) {
                // Show hunter revenge after a short delay
                setTimeout(showVoteHunterRevenge, 100);
                continueBtn.style.display = 'none';
            } else {
                continueBtn.style.display = 'block';
            }
            handleWerewolfPromotion();
            if (checkWinConditions()) return;
        }

        function showVoteHunterRevenge() {
            document.getElementById('vote-results').classList.add('hidden');
            document.getElementById('vote-hunter-revenge').classList.remove('hidden');
            
            const hunter = gameState.hunterRevengeQueue[0];
            document.getElementById('vote-hunter-name').textContent = hunter;
            
            const targetSelect = document.getElementById('vote-hunter-target');
            targetSelect.innerHTML = `
                <option value="">Select target</option>
                ${gameState.alivePlayers.map(p => `<option value="${p}">${p}</option>`).join('')}
            `;
            
            const confirmBtn = document.getElementById('confirm-vote-hunter-kill');
            confirmBtn.disabled = true;
            targetSelect.onchange = () => {
                confirmBtn.disabled = !targetSelect.value;
            };
        }

        function confirmVoteHunterKill() {
            const target = document.getElementById('vote-hunter-target').value;
            if (!target) {
                alert("Please select a target.");
                return;
            }

            logEvent(`${gameState.hunterRevengeQueue[0]} shot ${target} as hunter's revenge.`);
            const index = gameState.alivePlayers.indexOf(target);
            if (index !== -1) {
                gameState.alivePlayers.splice(index, 1);
                gameState.deaths.push({ name: target, cause: 'hunter revenge', night: gameState.dayNumber });
            }

            const targetIndex = gameState.players.indexOf(target);
            if (gameState.roles[targetIndex] === 'Hunter') {
                gameState.hunterRevengeQueue.push(target);
            }

            if (gameState.lovers.includes(target)) {
                const lover = gameState.lovers.find(l => l !== target);
                if (lover && gameState.alivePlayers.includes(lover)) {
                    const loverIndex = gameState.alivePlayers.indexOf(lover);
                    gameState.alivePlayers.splice(loverIndex, 1);
                    gameState.deaths.push({ name: lover, cause: 'lover suicide', night: gameState.dayNumber });
                }
            }

            // Remove processed hunter
            gameState.hunterRevengeQueue.shift();

            // Add kill message to vote summary
            const resultMsg = document.createElement('p');
            resultMsg.innerHTML = `<strong>${target} is killed by the hunter's revenge!</strong>`;
            document.getElementById('vote-summary').appendChild(resultMsg);

            // Check win condition
            if (checkWinConditions()) return;

            // If more hunter revenge queued
            if (gameState.hunterRevengeQueue.length > 0) {
                showVoteHunterRevenge();
            } else {
                // Show vote results with continue button
                document.getElementById('vote-hunter-revenge').classList.add('hidden');
                document.getElementById('vote-results').classList.remove('hidden');
                document.getElementById('continue-from-vote').style.display = 'block';
            }
        }

        function continueToNight() {
            // Check win conditions one more time
            if (checkWinConditions()) return;
            
            gameState.nightNumber++;
            startNight();
        }

        function checkWinConditions() {
            const aliveWerewolves = gameState.alivePlayers.filter(player => {
                const index = gameState.players.indexOf(player);
                return roleInfo[gameState.roles[index]].team === 'werewolf';
            });
            
            const aliveTown = gameState.alivePlayers.filter(player => {
                const index = gameState.players.indexOf(player);
                return roleInfo[gameState.roles[index]].team === 'town';
            });
            
            // Check lover win condition
            if (gameState.lovers.length === 2 && 
                gameState.alivePlayers.length === 2 && 
                gameState.lovers.every(lover => gameState.alivePlayers.includes(lover))) {
                endGame('Lovers', gameState.lovers);
                return true;
            }
            
            // Check werewolf win condition
            if (aliveWerewolves.length >= aliveTown.length) {
                endGame('Werewolves', aliveWerewolves);
                return true;
            }
            
            // Check town win condition
            if (aliveWerewolves.length === 0) {
                endGame('Town', aliveTown);
                return true;
            }
            
            return false;
        }

        function endGame(winner, winners) {
            // Hide all possible active screens
            [   'setup-phase',
                'voting-phase',
                'day-phase',
                'night-passing',
                'vote-results',
                'hunter-revenge',
                'vote-hunter-revenge',
                'seer-modal'
            ].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.classList.add('hidden');
            });

            // Optional: reset background to day theme for visibility
            document.body.className = 'day-theme';

            document.getElementById('game-over').classList.remove('hidden');
            document.querySelector('.phase-title').textContent = 'Game Over';

            let announcement = '';
            switch (winner) {
                case 'Werewolves':
                    announcement = `<h3>🐺 Werewolves Win! 🐺</h3><p>The werewolves have overrun the town!</p><p><strong>Winners:</strong> ${winners.join(', ')}</p>`;
                    break;
                case 'Town':
                    announcement = `<h3>🏬 Town Wins! 🏬</h3><p>All werewolves have been eliminated!</p><p><strong>Winners:</strong> ${winners.join(', ')}</p>`;
                    break;
                case 'Joker':
                    announcement = `<h3>🃏 Joker Wins! 🃏</h3><p>The Joker has successfully been burned at the stake!</p><p><strong>Winner:</strong> ${winners.join(', ')}</p>`;
                    break;
                case 'Lovers':
                    announcement = `<h3>💕 Love Wins! 💕</h3><p>The lovers are the last ones standing!</p><p><strong>Winners:</strong> ${winners.join(', ')}</p>`;
                    break;
            }

            // Show final game state
            announcement += '<br><h4>Final Roles:</h4>';
            gameState.players.forEach((player, index) => {
                const status = gameState.alivePlayers.includes(player) ? 
                    '<span class="alive">(Alive)</span>' : 
                    '<span class="dead-player">(Dead)</span>';
                announcement += `<p>${player}: ${gameState.roles[index]} ${status}</p>`;
            });

            document.getElementById('winner-announcement').innerHTML = announcement;
        }

        function getWerewolves() {
            return gameState.players.filter((player, index) => 
                roleInfo[gameState.roles[index]].team === 'werewolf' && 
                gameState.alivePlayers.includes(player)
            );
        }

        function getUnassignedRoles() {
            const assignedRoles = gameState.roles.slice();
            const unassigned = [];
            
            Object.entries(gameState.availableRoles).forEach(([role, config]) => {
                const assignedCount = assignedRoles.filter(r => r === role).length;
                const unassignedCount = config.count - assignedCount;
                for (let i = 0; i < unassignedCount; i++) {
                    unassigned.push(role);
                }
            });
            
            return unassigned;
        }

        
        function logEvent(message) {
            const logDiv = document.getElementById('event-log');
            const entry = document.createElement('div');
            entry.textContent = message;
            logDiv.appendChild(entry);
            logDiv.scrollTop = logDiv.scrollHeight; // Auto-scroll
        }


        function closeSeerModal() {
            document.getElementById('seer-modal').classList.add('hidden');
            if (gameState.deferAfterSeerModal) {
                gameState.deferAfterSeerModal();
                gameState.deferAfterSeerModal = null;
            }
        }

        // Initialize the game
        document.addEventListener('DOMContentLoaded', function() {

        const savedPlayers = localStorage.getItem('werewolfPlayers');
        const savedRoles = localStorage.getItem('werewolfRoles');
        if (savedPlayers && savedRoles) {
            gameState.players = JSON.parse(savedPlayers);
            gameState.availableRoles = JSON.parse(savedRoles);
            updatePlayersList();
            if (gameState.players.length >= 3) {
                document.getElementById('role-setup').classList.remove('hidden');
                setupRoleSelection();
            }
        }

            document.getElementById('player-name').focus();
        });