   let currentTab = 'entropy';
        let currentType = 'password';
        let idComplexity = 'chars';
        let isVisible = false;

        const adj = ["Swift", "Silent", "Neon", "Hidden", "Digital", "Golden", "Iron", "Vivid", "Cosmic", "Lunar"];
        const obj = ["Cipher", "Ghost", "Tower", "Bridge", "Nova", "Path", "Vertex", "Shield", "Core", "Drift"];

        function switchTab(tab) {
            currentTab = tab;
            document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
            document.getElementById(`pane-${tab}`).classList.remove('hidden');
            
            document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
            document.getElementById(`nav-${tab}`).classList.add('active');
            
            resetOutput();
        }

        function setType(type) {
            currentType = type;
            document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active-type'));
            document.getElementById(`type-${type}`).classList.add('active-type');
            
            const lenMap = { password: 16, pin: 6, passphrase: 24, token: 40 };
            document.getElementById('length-input').value = lenMap[type];
        }

        function setIdComplexity(mode) {
            idComplexity = mode;
            const charBtn = document.getElementById('id-comp-chars');
            const numBtn = document.getElementById('id-comp-nums');
            
            if (mode === 'chars') {
                charBtn.classList.add('border-teal-500/50', 'bg-teal-500/10');
                numBtn.classList.remove('border-teal-500/50', 'bg-teal-500/10');
                numBtn.classList.add('border-white/10');
            } else {
                numBtn.classList.add('border-teal-500/50', 'bg-teal-500/10');
                charBtn.classList.remove('border-teal-500/50', 'bg-teal-500/10');
                charBtn.classList.add('border-white/10');
            }
        }

        async function hashInput(str) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint32Array(hashBuffer));
        }

        function generate() {
            if (!validate()) return;

            if (currentTab === 'entropy') {
                createEntropyForge();
            } else {
                createIdentityForge();
            }
        }

        function validate() {
            let pass = true;
            
            // Check Entropy Length
            if (currentTab === 'entropy') {
                const len = parseInt(document.getElementById('length-input').value);
                const vLen = document.getElementById('v-length');
                if (isNaN(len) || len < 4 || len > 128) {
                    vLen.classList.add('show');
                    pass = false;
                } else { vLen.classList.remove('show'); }
            }

            // Check Identity Length
            if (currentTab === 'identity') {
                const idLen = parseInt(document.getElementById('id-length-input').value);
                const vIdLen = document.getElementById('v-id-length');
                if (isNaN(idLen) || idLen < 4 || idLen > 64) {
                    vIdLen.classList.add('show');
                    pass = false;
                } else { vIdLen.classList.remove('show'); }
            }

            return pass;
        }

        function createEntropyForge() {
            const len = parseInt(document.getElementById('length-input').value);
            const charset = getCharset();
            let res = "";
            const array = new Uint32Array(len);
            crypto.getRandomValues(array);
            
            for (let i = 0; i < len; i++) {
                res += charset[array[i] % charset.length];
            }
            displayResult(res);
        }

        async function createIdentityForge() {
            const personalData = [
                document.getElementById('id-first').value,
                document.getElementById('id-last').value,
                document.getElementById('id-alias').value,
                document.getElementById('id-email').value,
                document.getElementById('id-dob').value,
                document.getElementById('id-place').value
            ].join('::');

            const targetLen = parseInt(document.getElementById('id-length-input').value);
            const hash = await hashInput(personalData || Math.random().toString());
            
            let charset = idComplexity === 'nums' 
                ? "0123456789" 
                : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
            
            let res = "";
            // Use hash values to pick characters deterministically
            for (let i = 0; i < targetLen; i++) {
                const seedValue = hash[i % hash.length];
                const charIndex = (seedValue + i) % charset.length;
                res += charset[charIndex];
            }
            
            displayResult(res);
        }

        function getCharset() {
            let s = "";
            if (currentType === 'pin') return "0123456789";
            if (document.getElementById('inc-upper').checked) s += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            if (document.getElementById('inc-lower').checked) s += "abcdefghijklmnopqrstuvwxyz";
            if (document.getElementById('inc-nums').checked) s += "0123456789";
            if (document.getElementById('inc-syms').checked) s += "!@#$%^&*()_+-=[]{}|;:,.<>?";
            return s || "abcd123";
        }

        function displayResult(val) {
            document.getElementById('empty-state').classList.add('hidden');
            document.getElementById('output-screen').classList.remove('hidden');
            document.getElementById('final-output').value = val;
            
            const a = adj[Math.floor(Math.random() * adj.length)];
            const o = obj[Math.floor(Math.random() * obj.length)];
            document.getElementById('mnemonic-label').innerText = `${a} ${o}`;
            
            isVisible = false;
            updateView();
        }

        function toggleView() {
            isVisible = !isVisible;
            updateView();
        }

        function updateView() {
            const field = document.getElementById('final-output');
            const overlay = document.getElementById('face-toggle');
            const eye = document.getElementById('eye-icon');
            
            if (isVisible) {
                field.type = 'text';
                overlay.style.opacity = '0';
                overlay.style.pointerEvents = 'none';
                eye.innerText = '👓';
            } else {
                field.type = 'password';
                overlay.style.opacity = '1';
                overlay.style.pointerEvents = 'auto';
                eye.innerText = '👁️';
            }
        }

        function copyResult() {
            const field = document.getElementById('final-output');
            const oldType = field.type;
            field.type = 'text';
            field.select();
            document.execCommand('copy');
            field.type = oldType;

            const msg = document.getElementById('success-msg');
            msg.style.opacity = '1';
            setTimeout(() => msg.style.opacity = '0', 2000);
        }

        function resetOutput() {
            document.getElementById('empty-state').classList.remove('hidden');
            document.getElementById('output-screen').classList.add('hidden');
        }

        // Init
        setType('password');