    // State Management
        let appState = {
            type: 'password',
            length: 12,
            deterministic: false,
            visible: false,
            iconSet: 'eye' // Default to eye icon toggle
        };

        const adjectives = ["Silent", "Ethereal", "Crimson", "Vibrant", "Ancient", "Hidden", "Swift", "Icy", "Golden", "Midnight", "Cosmic", "Neon", "Shadow", "Wandering"];
        const nouns = ["Penguin", "Galaxy", "Tiger", "Waterfall", "Shadow", "Resonance", "Citadel", "Nomad", "Nebula", "Falcon", "Ghost", "Glacier", "Echo", "Void"];

        function selectType(type) {
            appState.type = type;
            document.querySelectorAll('.type-btn').forEach(btn => {
                btn.classList.remove('border-teal-500', 'bg-teal-900/20');
                if(btn.dataset.type === type) btn.classList.add('border-teal-500', 'bg-teal-900/20');
            });

            // Adjust default length based on type
            const defaults = { pin: 6, password: 12, passphrase: 24, token: 32 };
            setLength(defaults[type]);
            
            // Adjust checkboxes
            document.getElementById('check-numbers').checked = true;
            document.getElementById('check-upper').checked = (type !== 'pin');
            document.getElementById('check-lower').checked = (type !== 'pin');
            document.getElementById('check-symbols').checked = (type === 'password' || type === 'token');
        }

        function setLength(l) {
            appState.length = l;
            document.getElementById('custom-length').value = l;
            document.querySelectorAll('.len-btn').forEach(btn => {
                btn.classList.toggle('bg-gray-800', parseInt(btn.innerText) === l);
            });
        }

        // Cryptographic Functions
        async function getHash(input) {
            const encoder = new TextEncoder();
            const data = encoder.encode(input);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return new Uint32Array(hashBuffer);
        }

        function mulberry32(a) {
            return function() {
                let t = a += 0x6D2B79F5;
                t = Math.imul(t ^ t >>> 15, t | 1);
                t ^= t + Math.imul(t ^ t >>> 7, t | 61);
                return ((t ^ t >>> 14) >>> 0) / 4294967296;
            }
        }

        function validateInputs() {
            let isValid = true;
            const customLen = parseInt(document.getElementById('custom-length').value);
            const lenVal = document.getElementById('length-validation');
            const charsetVal = document.getElementById('charset-validation');

            if (isNaN(customLen) || customLen < 4 || customLen > 128) {
                lenVal.classList.add('visible');
                isValid = false;
            } else {
                lenVal.classList.remove('visible');
                appState.length = customLen;
            }

            const anyChecked = document.getElementById('check-upper').checked || 
                               document.getElementById('check-lower').checked || 
                               document.getElementById('check-numbers').checked || 
                               document.getElementById('check-symbols').checked ||
                               document.getElementById('custom-symbols').value.length > 0;

            if (!anyChecked) {
                charsetVal.classList.add('visible');
                isValid = false;
            } else {
                charsetVal.classList.remove('visible');
            }

            return isValid;
        }

        async function handleGenerate() {
            if (!validateInputs()) return;

            const seed = document.getElementById('seed-input').value;
            const deterministic = document.getElementById('check-deterministic').checked;
            const charset = buildCharset();
            
            let result = "";
            let randomSource;

            if (deterministic && seed) {
                const hash = await getHash(seed);
                randomSource = mulberry32(hash[0]);
                
                // Mnemonic Name
                const adjIdx = hash[1] % adjectives.length;
                const nounIdx = hash[2] % nouns.length;
                document.getElementById('mnemonic-name').innerText = `${adjectives[adjIdx]} ${nouns[nounIdx]}`;
            } else {
                randomSource = () => crypto.getRandomValues(new Uint32Array(1))[0] / 4294967296;
                // Random Mnemonic
                const randomAdj = adjectives[Math.floor(Math.random() * adjectives.length)];
                const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
                document.getElementById('mnemonic-name').innerText = `${randomAdj} ${randomNoun}`;
            }

            // Core Generation
            for (let i = 0; i < appState.length; i++) {
                result += charset[Math.floor(randomSource() * charset.length)];
            }

            // Formatting
            const format = document.querySelector('input[name="format"]:checked').value;
            if (format === 'grouped' && appState.length >= 8) {
                result = result.match(/.{1,4}/g).join('-');
            }

            document.getElementById('output-field').value = result;
            showResults();
        }

        function buildCharset() {
            let set = "";
            const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const lower = "abcdefghijklmnopqrstuvwxyz";
            const nums = "0123456789";
            const syms = "!@#$%^&*";
            const ambig = "0O1lI";

            if (document.getElementById('check-upper').checked) set += upper;
            if (document.getElementById('check-lower').checked) set += lower;
            if (document.getElementById('check-numbers').checked) set += nums;
            if (document.getElementById('check-symbols').checked) set += syms;
            set += document.getElementById('custom-symbols').value;

            const format = document.querySelector('input[name="format"]:checked').value;
            if (format === 'ambig') {
                for (let char of ambig) {
                    set = set.split(char).join('');
                }
            }
            return set;
        }

        function showResults() {
            document.getElementById('setup-form').classList.add('hidden-section');
            document.getElementById('result-screen').classList.remove('hidden-section');
            appState.visible = false;
            document.getElementById('output-field').type = 'password';
            updateToggleIcon();
        }

        function resetApp() {
            document.getElementById('setup-form').classList.remove('hidden-section');
            document.getElementById('result-screen').classList.add('hidden-section');
        }

        function toggleVisibility() {
            appState.visible = !appState.visible;
            const field = document.getElementById('output-field');
            field.type = appState.visible ? 'text' : 'password';
            updateToggleIcon();
        }

        function updateToggleIcon() {
            const icon = document.getElementById('toggle-icon');
            // User can "choose" icon style by preference, defaulting to Eye for clarity 
            // but we can cycle icons for fun as an "easter egg" or setting
            if (appState.visible) {
                icon.innerText = appState.iconSet === 'eye' ? '👁️' : '😎';
            } else {
                icon.innerText = appState.iconSet === 'eye' ? '🙈' : '😶';
            }
        }

        function copyToClipboard() {
            const field = document.getElementById('output-field');
            const originalType = field.type;
            field.type = 'text';
            field.select();
            document.execCommand('copy');
            field.type = originalType;
            
            const btn = event.currentTarget;
            const originalText = btn.innerText;
            btn.innerText = '✅';
            setTimeout(() => btn.innerText = '📋', 1500);
        }

        // Live Validation for length input
        document.getElementById('custom-length').addEventListener('input', (e) => {
            const val = parseInt(e.target.value);
            const msg = document.getElementById('length-validation');
            if (val < 4 || val > 128) {
                msg.classList.add('visible');
            } else {
                msg.classList.remove('visible');
            }
        });