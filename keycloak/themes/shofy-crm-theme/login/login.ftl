<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('username','password') displayInfo=realm.password && realm.registrationAllowed && !registrationDisabled??; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="crm-page-wrapper">
        <!-- Left panel — branding -->
        <div class="crm-brand-panel">
            <div class="crm-brand-shapes">
                <div class="crm-shape crm-shape-1"></div>
                <div class="crm-shape crm-shape-2"></div>
                <div class="crm-shape crm-shape-3"></div>
            </div>
            <div class="crm-brand-content">
                <div class="crm-brand-logo">
                    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
                        <polyline points="9 22 9 12 15 12 15 22"/>
                    </svg>
                </div>
                <h1 class="crm-brand-title">Shofy CRM</h1>
                <p class="crm-brand-subtitle">Management Dashboard</p>
                <div class="crm-brand-features">
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Product Management</span>
                    </div>
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Order Tracking</span>
                    </div>
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Customer Insights</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right panel — login form -->
        <div class="crm-form-panel">
            <div class="crm-login-card">

                <#if realm.internationalizationEnabled && locale.supported?size gt 1>
                <div class="crm-lang-switcher">
                    <button type="button" class="crm-lang-btn" onclick="toggleLangMenu()" aria-haspopup="true">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
                            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        <span>${locale.current}</span>
                        <svg class="crm-lang-chevron" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                    </button>
                    <ul class="crm-lang-menu" id="crm-lang-menu" role="menu">
                        <#list locale.supported as sup>
                        <li role="none">
                            <a href="${sup.url}" role="menuitem" class="crm-lang-option <#if sup.languageTag == locale.current>crm-lang-active</#if>">
                                ${sup.label}
                            </a>
                        </li>
                        </#list>
                    </ul>
                </div>
                </#if>

                <h2 class="crm-form-title">${msg("crm.login.title")}</h2>
                <p class="crm-form-subtitle">${msg("crm.login.subtitle")}</p>

                <form id="kc-form-login" onsubmit="login.disabled = true; return true;"
                      action="${url.loginAction}" method="post">

                    <!-- Username -->
                    <div class="crm-field">
                        <label class="crm-label" for="username">${msg("crm.login.usernameLabel")}</label>
                        <div class="crm-input-wrapper">
                            <span class="crm-input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                            </span>
                            <input tabindex="1"
                                   id="username"
                                   class="crm-input<#if messagesPerField.existsError('username')> crm-input-error</#if>"
                                   name="username"
                                   value="${(login.username!'')}"
                                   type="text"
                                   autofocus
                                   autocomplete="off"
                                   placeholder="${msg("crm.login.usernamePlaceholder")}" />
                        </div>
                    </div>

                    <!-- Password -->
                    <div class="crm-field">
                        <label class="crm-label" for="password">${msg("crm.login.passwordLabel")}</label>
                        <div class="crm-input-wrapper crm-password-wrapper">
                            <span class="crm-input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                            </span>
                            <input tabindex="2"
                                   id="password"
                                   class="crm-input"
                                   name="password"
                                   type="password"
                                   autocomplete="off"
                                   placeholder="${msg("crm.login.passwordPlaceholder")}" />
                            <button type="button" class="crm-toggle-password" onclick="togglePassword()" tabindex="3">
                                <svg class="crm-eye-icon" id="eyeIcon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                                    <line x1="1" y1="1" x2="23" y2="23"/>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Error alerts -->
                    <#if message?has_content && (message.type != 'warning' || !isAppInitiatedAction??)>
                        <div class="crm-alert crm-alert-${message.type}">
                            ${kcSanitize(message.summary)?no_esc}
                        </div>
                    </#if>

                    <!-- Remember me + Forgot -->
                    <div class="crm-form-options">
                        <#if realm.rememberMe && !usernameHidden??>
                        <label class="crm-checkbox">
                            <input tabindex="4" id="rememberMe" name="rememberMe" type="checkbox"
                                   <#if login.rememberMe??>checked</#if>>
                            <span class="crm-checkmark"></span>
                            ${msg("crm.login.rememberMe")}
                        </label>
                        </#if>

                        <#if realm.resetPasswordAllowed>
                        <a tabindex="5" class="crm-forgot-link" href="${url.loginResetCredentialsUrl}<#if locale??>&ui_locales=${locale.current}</#if>">
                            ${msg("crm.login.forgotPassword")}
                        </a>
                        </#if>
                    </div>

                    <!-- Submit -->
                    <div class="crm-button-wrapper">
                        <input type="hidden" id="id-hidden-input" name="credentialId"
                               <#if auth.selectedCredential?has_content>value="${auth.selectedCredential}"</#if>/>
                        <button tabindex="6" class="crm-submit-btn" name="login" id="kc-login" type="submit">
                            ${msg("crm.login.submitBtn")}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                        </button>
                    </div>
                </form>

                <div class="crm-footer-text">
                    ${msg("crm.login.footer")}
                </div>
            </div>
        </div>
    </div>

    <script>
        window.CRM_TOAST_TITLES = {
            error:   '${msg("crm.toast.error")}',
            warning: '${msg("crm.toast.warning")}',
            success: '${msg("crm.toast.success")}',
            info:    '${msg("crm.toast.info")}',
        };

        function toggleLangMenu() {
            var switcher = document.querySelector('.crm-lang-switcher');
            switcher.classList.toggle('open');
            document.getElementById('crm-lang-menu').classList.toggle('crm-lang-menu-open');
        }
        document.addEventListener('click', function(e) {
            var switcher = document.querySelector('.crm-lang-switcher');
            if (switcher && !switcher.contains(e.target)) {
                switcher.classList.remove('open');
                document.getElementById('crm-lang-menu').classList.remove('crm-lang-menu-open');
            }
        });

        function togglePassword() {
            var input = document.getElementById('password');
            var icon = document.getElementById('eyeIcon');
            if (input.type === 'password') {
                input.type = 'text';
                icon.innerHTML = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>';
            } else {
                input.type = 'password';
                icon.innerHTML = '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>';
            }
        }
    </script>

    </#if>
</@layout.registrationLayout>
