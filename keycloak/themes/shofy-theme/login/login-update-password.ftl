<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="shofy-page-wrapper">
        <div class="shofy-bg-shapes">
            <div class="shofy-shape shofy-shape-1"></div>
            <div class="shofy-shape shofy-shape-2"></div>
            <div class="shofy-shape shofy-shape-3"></div>
            <div class="shofy-shape shofy-shape-4"></div>
        </div>

        <div class="shofy-login-card shofy-reset-card">

            <#if realm.internationalizationEnabled && locale.supported?size gt 1>
            <div class="shofy-lang-switcher">
                <button type="button" class="shofy-lang-btn" onclick="toggleLangMenu()" aria-haspopup="true">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                    </svg>
                    <span>${locale.current}</span>
                    <svg class="shofy-lang-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="6 9 12 15 18 9"/>
                    </svg>
                </button>
                <ul class="shofy-lang-menu" id="shofy-lang-menu" role="menu">
                    <#list locale.supported as sup>
                    <li role="none">
                        <a href="${sup.url}" role="menuitem" class="shofy-lang-option <#if sup.languageTag == locale.current>shofy-lang-active</#if>">
                            ${sup.label}
                        </a>
                    </li>
                    </#list>
                </ul>
            </div>
            </#if>

            <!-- Icon -->
            <div class="shofy-reset-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0989FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
            </div>

            <h2 class="shofy-form-title">${msg("shofy.updatePwd.title")}</h2>
            <p class="shofy-form-subtitle">${msg("shofy.updatePwd.subtitle")}</p>

            <form id="kc-passwd-update-form" action="${url.loginAction}" method="post">

                <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="shofy-alert shofy-alert-${message.type}">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <input type="text" id="username" name="username" value="${username!''}" autocomplete="username" style="display:none;" />

                <!-- New Password -->
                <div class="shofy-field">
                    <label class="shofy-label" for="password-new">${msg("shofy.updatePwd.newPwdLabel")}</label>
                    <div class="shofy-input-wrapper shofy-password-wrapper">
                        <input tabindex="1"
                               id="password-new"
                               class="shofy-input<#if messagesPerField.existsError('password-new','password-confirm')> shofy-input-error</#if>"
                               name="password-new"
                               type="password"
                               autocomplete="new-password"
                               autofocus
                               placeholder="${msg("shofy.updatePwd.newPwdPlaceholder")}" />
                        <button type="button" class="shofy-toggle-password" onclick="togglePwd('password-new', this)" tabindex="-1">
                            <svg class="shofy-eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                    <#if messagesPerField.existsError('password-new')>
                        <span class="shofy-field-error">${kcSanitize(messagesPerField.get('password-new'))?no_esc}</span>
                    </#if>
                    <!-- Password strength meter -->
                    <div class="shofy-strength" id="shofy-strength" aria-hidden="true">
                        <div class="shofy-strength-bars">
                            <span class="shofy-strength-bar"></span>
                            <span class="shofy-strength-bar"></span>
                            <span class="shofy-strength-bar"></span>
                            <span class="shofy-strength-bar"></span>
                        </div>
                        <span class="shofy-strength-label" id="shofy-strength-label"></span>
                    </div>
                </div>

                <!-- Confirm Password -->
                <div class="shofy-field">
                    <label class="shofy-label" for="password-confirm">${msg("shofy.updatePwd.confirmPwdLabel")}</label>
                    <div class="shofy-input-wrapper shofy-password-wrapper">
                        <input tabindex="2"
                               id="password-confirm"
                               class="shofy-input<#if messagesPerField.existsError('password-confirm')> shofy-input-error</#if>"
                               name="password-confirm"
                               type="password"
                               autocomplete="new-password"
                               placeholder="${msg("shofy.updatePwd.confirmPwdPlaceholder")}" />
                        <button type="button" class="shofy-toggle-password" onclick="togglePwd('password-confirm', this)" tabindex="-1">
                            <svg class="shofy-eye-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                    <#if messagesPerField.existsError('password-confirm')>
                        <span class="shofy-field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                    </#if>
                </div>

                <div class="shofy-button-wrapper">
                    <button tabindex="3" class="shofy-submit-btn" type="submit">
                        ${msg("shofy.updatePwd.submitBtn")}
                    </button>
                </div>

            </form>
        </div>
    </div>

    <script>
        window.SHOFY_TOAST_TITLES = {
            error:   '${msg("shofy.toast.error")}',
            warning: '${msg("shofy.toast.warning")}',
            success: '${msg("shofy.toast.success")}',
            info:    '${msg("shofy.toast.info")}',
        };

        /* ── Client-side validation (update password) ── */
        var UV = {
            passwordRequired:  '${msg("shofy.register.passwordRequired")}',
            passwordMinLength: '${msg("shofy.register.passwordMinLength")}',
            passwordDigit:     '${msg("shofy.register.passwordDigit")}',
            passwordUppercase: '${msg("shofy.register.passwordUppercase")}',
            passwordLowercase: '${msg("shofy.register.passwordLowercase")}',
            passwordSpecial:   '${msg("shofy.register.passwordSpecial")}',
            passwordMismatch:  '${msg("shofy.register.passwordMismatch")}',
            strengthWeak:      '${msg("shofy.strength.weak")}',
            strengthFair:      '${msg("shofy.strength.fair")}',
            strengthGood:      '${msg("shofy.strength.good")}',
            strengthStrong:    '${msg("shofy.strength.strong")}',
        };

        function uShowError(input, message) {
            uClearError(input);
            input.classList.add('shofy-input-error');
            var parent = input.closest('.shofy-password-wrapper') || input;
            var field = parent.closest('.shofy-field') || parent.parentNode;
            var span = document.createElement('span');
            span.className = 'shofy-field-error shofy-js-error';
            span.textContent = message;
            field.appendChild(span);
        }
        function uClearError(input) {
            input.classList.remove('shofy-input-error');
            var field = input.closest('.shofy-field');
            if (field) field.querySelectorAll('.shofy-js-error').forEach(function(el){ el.remove(); });
        }

        function uValidatePassword(input) {
            var val = input.value;
            if (!val)                  { uShowError(input, UV.passwordRequired);  return false; }
            if (val.length < 8)        { uShowError(input, UV.passwordMinLength); return false; }
            if (!/[0-9]/.test(val))    { uShowError(input, UV.passwordDigit);     return false; }
            if (!/[A-Z]/.test(val))    { uShowError(input, UV.passwordUppercase); return false; }
            if (!/[a-z]/.test(val))    { uShowError(input, UV.passwordLowercase); return false; }
            if (!/[^A-Za-z0-9]/.test(val)) { uShowError(input, UV.passwordSpecial); return false; }
            uClearError(input);
            return true;
        }

        function uScore(val) {
            if (!val) return 0;
            var s = 0;
            if (val.length >= 8) s++;
            if (/[A-Z]/.test(val) && /[a-z]/.test(val)) s++;
            if (/[0-9]/.test(val)) s++;
            if (val.length >= 12 || /[^A-Za-z0-9]/.test(val)) s++;
            return Math.min(s, 4);
        }
        function uUpdateMeter(val) {
            var meter = document.getElementById('shofy-strength');
            var label = document.getElementById('shofy-strength-label');
            if (!meter || !label) return;
            var sc = uScore(val);
            var bars = meter.querySelectorAll('.shofy-strength-bar');
            meter.classList.toggle('is-visible', val.length > 0);
            meter.setAttribute('data-score', String(sc));
            var labels = ['', UV.strengthWeak, UV.strengthFair, UV.strengthGood, UV.strengthStrong];
            label.textContent = val.length === 0 ? '' : labels[sc];
            for (var i = 0; i < bars.length; i++) bars[i].classList.toggle('is-active', i < sc);
        }

        document.addEventListener('DOMContentLoaded', function() {
            var form    = document.getElementById('kc-passwd-update-form');
            var pwdNew  = document.getElementById('password-new');
            var pwdConf = document.getElementById('password-confirm');

            if (pwdNew) {
                pwdNew.addEventListener('input', function() { uClearError(pwdNew); uUpdateMeter(pwdNew.value); });
                pwdNew.addEventListener('blur',  function() { uValidatePassword(pwdNew); });
            }
            if (pwdConf) {
                pwdConf.addEventListener('input', function() { uClearError(pwdConf); });
                pwdConf.addEventListener('blur',  function() {
                    if (!pwdConf.value || pwdConf.value !== pwdNew.value) uShowError(pwdConf, UV.passwordMismatch);
                    else uClearError(pwdConf);
                });
            }
            if (form) form.addEventListener('submit', function(e) {
                var valid = true;
                if (pwdNew && !uValidatePassword(pwdNew)) valid = false;
                if (pwdConf && (!pwdConf.value || pwdConf.value !== pwdNew.value)) { uShowError(pwdConf, UV.passwordMismatch); valid = false; }
                if (!valid) { e.preventDefault(); var first = form.querySelector('.shofy-input-error'); if (first) first.focus(); }
            });
        });

        function toggleLangMenu() {
            var switcher = document.querySelector('.shofy-lang-switcher');
            switcher.classList.toggle('open');
            document.getElementById('shofy-lang-menu').classList.toggle('shofy-lang-menu-open');
        }
        document.addEventListener('click', function(e) {
            var switcher = document.querySelector('.shofy-lang-switcher');
            if (switcher && !switcher.contains(e.target)) {
                switcher.classList.remove('open');
                document.getElementById('shofy-lang-menu').classList.remove('shofy-lang-menu-open');
            }
        });

        function togglePwd(inputId, btn) {
            var input = document.getElementById(inputId);
            var svg = btn.querySelector('svg');
            if (input.type === 'password') {
                input.type = 'text';
                svg.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            } else {
                input.type = 'password';
                svg.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            }
        }
    </script>

    </#if>
</@layout.registrationLayout>
