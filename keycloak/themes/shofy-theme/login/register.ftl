<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('firstName','lastName','email','username','password','password-confirm') displayInfo=false; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="shofy-page-wrapper">
        <div class="shofy-bg-shapes">
            <div class="shofy-shape shofy-shape-1"></div>
            <div class="shofy-shape shofy-shape-2"></div>
            <div class="shofy-shape shofy-shape-3"></div>
            <div class="shofy-shape shofy-shape-4"></div>
        </div>

        <div class="shofy-login-card shofy-register-card">

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

            <!-- Logo -->
            <div class="shofy-logo">
                <svg width="120" height="36" viewBox="0 0 120 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <text x="0" y="28" font-family="Jost, sans-serif" font-size="30" font-weight="700" fill="#010F1C">Shofy</text>
                </svg>
            </div>

            <h2 class="shofy-form-title">${msg("shofy.register.title")}</h2>
            <p class="shofy-form-subtitle">
                ${msg("shofy.register.subtitle")}
                <a href="${url.loginUrl}<#if locale??>&ui_locales=${locale.current}</#if>">${msg("shofy.register.loginLink")}</a>
            </p>

            <#if social.providers?? && social.providers?size gt 0>
            <div class="shofy-social-login">
                <#list social.providers as p>
                <a href="${p.loginUrl}" class="shofy-social-btn shofy-social-${p.alias}" id="social-${p.alias}">
                    <#if p.alias == "google">
                    <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                    </#if>
                    <span>${p.displayName}</span>
                </a>
                </#list>
            </div>
            <div class="shofy-divider">
                <span>${msg("shofy.register.orEmail")}</span>
            </div>
            </#if>

            <form id="kc-register-form" action="${url.registrationAction}" method="post">

                <div class="shofy-field-row">
                    <!-- First Name -->
                    <div class="shofy-field shofy-field-half">
                        <label class="shofy-label" for="firstName">${msg("shofy.register.firstNameLabel")}</label>
                        <input tabindex="1"
                               id="firstName"
                               class="shofy-input<#if messagesPerField.existsError('firstName')> shofy-input-error</#if>"
                               name="firstName"
                               value="${(register.formData.firstName!'')}"
                               type="text"
                               autofocus
                               placeholder="${msg("shofy.register.firstNamePlaceholder")}" />
                        <#if messagesPerField.existsError('firstName')>
                            <span class="shofy-field-error">${kcSanitize(messagesPerField.get('firstName'))?no_esc}</span>
                        </#if>
                    </div>

                    <!-- Last Name -->
                    <div class="shofy-field shofy-field-half">
                        <label class="shofy-label" for="lastName">${msg("shofy.register.lastNameLabel")}</label>
                        <input tabindex="2"
                               id="lastName"
                               class="shofy-input<#if messagesPerField.existsError('lastName')> shofy-input-error</#if>"
                               name="lastName"
                               value="${(register.formData.lastName!'')}"
                               type="text"
                               placeholder="${msg("shofy.register.lastNamePlaceholder")}" />
                        <#if messagesPerField.existsError('lastName')>
                            <span class="shofy-field-error">${kcSanitize(messagesPerField.get('lastName'))?no_esc}</span>
                        </#if>
                    </div>
                </div>

                <!-- Email -->
                <div class="shofy-field">
                    <label class="shofy-label" for="email">${msg("shofy.register.emailLabel")}</label>
                    <input tabindex="3"
                           id="email"
                           class="shofy-input<#if messagesPerField.existsError('email')> shofy-input-error</#if>"
                           name="email"
                           value="${(register.formData.email!'')}"
                           type="text"
                           autocomplete="email"
                           placeholder="${msg("shofy.register.emailPlaceholder")}" />
                    <#if messagesPerField.existsError('email')>
                        <span class="shofy-field-error">${kcSanitize(messagesPerField.get('email'))?no_esc}</span>
                    </#if>
                </div>

                <#if !realm.registrationEmailAsUsername>
                <!-- Username -->
                <div class="shofy-field">
                    <label class="shofy-label" for="username">${msg("shofy.register.usernameLabel")}</label>
                    <input tabindex="4"
                           id="username"
                           class="shofy-input<#if messagesPerField.existsError('username')> shofy-input-error</#if>"
                           name="username"
                           value="${(register.formData.username!'')}"
                           type="text"
                           autocomplete="username"
                           placeholder="${msg("shofy.register.usernamePlaceholder")}" />
                    <#if messagesPerField.existsError('username')>
                        <span class="shofy-field-error">${kcSanitize(messagesPerField.get('username'))?no_esc}</span>
                    </#if>
                </div>
                </#if>

                <!-- Password -->
                <div class="shofy-field">
                    <label class="shofy-label" for="password">${msg("shofy.register.passwordLabel")}</label>
                    <div class="shofy-input-wrapper shofy-password-wrapper">
                        <input tabindex="5"
                               id="password"
                               class="shofy-input<#if messagesPerField.existsError('password','password-confirm')> shofy-input-error</#if>"
                               name="password"
                               type="password"
                               autocomplete="new-password"
                               placeholder="${msg("shofy.register.passwordPlaceholder")}" />
                        <button type="button" class="shofy-toggle-password" onclick="togglePwd('password', this)" tabindex="-1" aria-label="Toggle password">
                            <svg class="shofy-eye-icon" id="eye-pwd" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                    <#if messagesPerField.existsError('password')>
                        <span class="shofy-field-error">${kcSanitize(messagesPerField.get('password'))?no_esc}</span>
                    </#if>
                </div>

                <!-- Confirm Password -->
                <div class="shofy-field">
                    <label class="shofy-label" for="password-confirm">${msg("shofy.register.confirmPasswordLabel")}</label>
                    <div class="shofy-input-wrapper shofy-password-wrapper">
                        <input tabindex="6"
                               id="password-confirm"
                               class="shofy-input<#if messagesPerField.existsError('password-confirm')> shofy-input-error</#if>"
                               name="password-confirm"
                               type="password"
                               autocomplete="new-password"
                               placeholder="${msg("shofy.register.confirmPasswordPlaceholder")}" />
                        <button type="button" class="shofy-toggle-password" onclick="togglePwd('password-confirm', this)" tabindex="-1" aria-label="Toggle password">
                            <svg class="shofy-eye-icon" id="eye-confirm" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                <line x1="1" y1="1" x2="23" y2="23"/>
                            </svg>
                        </button>
                    </div>
                    <#if messagesPerField.existsError('password-confirm')>
                        <span class="shofy-field-error">${kcSanitize(messagesPerField.get('password-confirm'))?no_esc}</span>
                    </#if>
                </div>

                <!-- Error alerts -->
                <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                    <div class="shofy-alert shofy-alert-${message.type}">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <!-- Terms -->
                <div class="shofy-terms">
                    <label class="shofy-checkbox">
                        <input tabindex="7" id="terms" name="terms" type="checkbox" required>
                        <span class="shofy-checkmark"></span>
                        ${msg("shofy.register.termsAgree")}
                    </label>
                </div>

                <!-- Submit -->
                <div class="shofy-button-wrapper">
                    <button tabindex="8" class="shofy-submit-btn" type="submit">
                        ${msg("shofy.register.submitBtn")}
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
