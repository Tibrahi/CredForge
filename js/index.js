let currentTab = 'entropy';
        let currentType = 'password';
        let idComplexity = 'chars';
        let isVisible = false;

        // Minimalist Mnemonics
        const adj = ["Alpha", "Epsilon", "Omega", "Prime", "Void", "Solar", "Lunar", "Static", "Zenith", "Nadir"];
        const obj = ["Cipher", "Matrix", "Vector", "Node", "Pulse", "Ghost", "Gate", "Core", "Drift", "Flux"];

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
            const cBtn = document.getElementById('id-comp-chars');
            const nBtn = document.getElementById('id-comp-nums');
            
            if(mode === 'chars') {
                cBtn.className = "py-4 text-[10px] font-bold border border-white bg-white text-black uppercase";
                nBtn.className = "py-4 text-[10px] font-bold border border-white/20 text-white uppercase hover:bg-white/5";
            } else {
                nBtn.className = "py-4 text-[10px] font-bold border border-white bg-white text-black uppercase";
                cBtn.className = "py-4 text-[10px] font-bold border border-white/20 text-white uppercase hover:bg-white/5";
            }
        }

        async function hashInput(str) {
            const encoder = new TextEncoder();
            const data = encoder.encode(str);
            const buffer = await crypto.subtle.digest('SHA-256', data);
            return Array.from(new Uint32Array(buffer));
        }

        function validate() {
            let pass = true;
            const lenEl = currentTab === 'entropy' ? document.getElementById('length-input') : document.getElementById('id-length-input');
            const vMsg = currentTab === 'entropy' ? document.getElementById('v-length') : document.getElementById('v-id-length');
            const len = parseInt(lenEl.value);

            if (isNaN(len) || len < 4 || len > 256) {
                vMsg.classList.add('show');
                pass = false;
            } else { vMsg.classList.remove('show'); }

            if (currentTab === 'identity') {
                const email = document.getElementById('id-email').value;
                const vEmail = document.getElementById('v-email');
                if (email && !email.includes('@')) {
                    vEmail.classList.add('show');
                    pass = false;
                } else { vEmail.classList.remove('show'); }
            }
            return pass;
        }

        async function generate() {
            if (!validate()) return;

            let result = "";
            const length = parseInt(currentTab === 'entropy' ? document.getElementById('length-input').value : document.getElementById('id-length-input').value);

            if (currentTab === 'entropy') {
                const charset = getCharset();
                const randomValues = new Uint32Array(length);
                crypto.getRandomValues(randomValues);
                for(let i=0; i<length; i++) result += charset[randomValues[i] % charset.length];
            } else {
                const personal = [
                    document.getElementById('id-first').value,
                    document.getElementById('id-last').value,
                    document.getElementById('id-alias').value,
                    document.getElementById('id-email').value,
                    document.getElementById('id-dob').value,
                    document.getElementById('id-place').value
                ].join('::');
                
                const hash = await hashInput(personal || Math.random().toString());
                const charset = idComplexity === 'nums' ? "0123456789" : "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
                
                for(let i=0; i<length; i++) {
                    const seed = hash[i % hash.length];
                    result += charset[(seed + i) % charset.length];
                }
            }

            displayResult(result);
        }

        function getCharset() {
            if (currentType === 'pin') return "0123456789";
            let s = "";
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
                eye.innerText = '👁';
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

        // Initialize default
        setType('password');