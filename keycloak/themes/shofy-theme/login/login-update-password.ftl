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
