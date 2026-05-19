<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=!messagesPerField.existsError('totp','userLabel'); section>

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
                        <rect x="5" y="11" width="14" height="10" rx="2"/>
                        <path d="M8 11V7a4 4 0 0 1 8 0v4"/>
                    </svg>
                </div>
                <h1 class="crm-brand-title">${msg("crm.totp.brand.title")}</h1>
                <p class="crm-brand-subtitle">${msg("crm.totp.brand.subtitle")}</p>
                <div class="crm-brand-features">
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${msg("crm.totp.brand.feature1")}</span>
                    </div>
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${msg("crm.totp.brand.feature2")}</span>
                    </div>
                    <div class="crm-feature">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>${msg("crm.totp.brand.feature3")}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Right panel — TOTP setup form -->
        <div class="crm-form-panel">
            <div class="crm-login-card crm-totp-card">

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

                <!-- Step indicator -->
                <div class="crm-step-indicator">
                    <div class="crm-step crm-step-active">
                        <span class="crm-step-dot">1</span>
                        <span class="crm-step-label">${msg("crm.totp.step1")}</span>
                    </div>
                    <div class="crm-step-bar"></div>
                    <div class="crm-step crm-step-active">
                        <span class="crm-step-dot">2</span>
                        <span class="crm-step-label">${msg("crm.totp.step2")}</span>
                    </div>
                </div>

                <h2 class="crm-form-title">${msg("crm.totp.title")}</h2>
                <p class="crm-form-subtitle">${msg("crm.totp.subtitle")}</p>

                <!-- Submission errors only — the "you need to set up" warning that
                     Keycloak auto-injects is already covered by our title. -->
                <#if message?has_content && message.type == 'error'>
                    <div class="crm-alert crm-alert-error">
                        ${kcSanitize(message.summary)?no_esc}
                    </div>
                </#if>

                <!-- Tabs: QR vs Manual -->
                <div class="crm-tabs" role="tablist">
                    <button type="button" class="crm-tab crm-tab-active" id="crm-tab-qr"
                            role="tab" aria-selected="true" onclick="switchTotpTab('qr')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/>
                            <rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/>
                            <rect x="18" y="18" width="3" height="3"/>
                        </svg>
                        ${msg("crm.totp.tab.qr")}
                    </button>
                    <button type="button" class="crm-tab" id="crm-tab-manual"
                            role="tab" aria-selected="false" onclick="switchTotpTab('manual')">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                            <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/>
                            <line x1="12" y1="4" x2="12" y2="20"/>
                        </svg>
                        ${msg("crm.totp.tab.manual")}
                    </button>
                </div>

                <!-- QR panel -->
                <div class="crm-totp-panel" id="crm-panel-qr">
                    <p class="crm-totp-instruction">${msg("crm.totp.qr.instruction")}</p>
                    <div class="crm-qr-frame">
                        <img src="data:image/png;base64, ${totp.totpSecretQrCode}"
                             alt="${msg("crm.totp.qr.alt")}"
                             class="crm-qr-image" />
                    </div>
                    <div class="crm-totp-apps">
                        <span class="crm-totp-apps-label">${msg("crm.totp.apps.label")}</span>
                        <div class="crm-totp-apps-list">
                            <#if totp.supportedApplications?? && totp.supportedApplications?size gt 0>
                                <#list totp.supportedApplications as app>
                                    <span class="crm-totp-app-chip">${msg(app)}</span>
                                </#list>
                            <#else>
                                <span class="crm-totp-app-chip">Google Authenticator</span>
                                <span class="crm-totp-app-chip">Microsoft Authenticator</span>
                                <span class="crm-totp-app-chip">Authy</span>
                                <span class="crm-totp-app-chip">1Password</span>
                            </#if>
                        </div>
                    </div>
                </div>

                <!-- Manual panel -->
                <div class="crm-totp-panel" id="crm-panel-manual" hidden>
                    <p class="crm-totp-instruction">${msg("crm.totp.manual.instruction")}</p>
                    <div class="crm-secret-block">
                        <label class="crm-secret-label">${msg("crm.totp.manual.secretLabel")}</label>
                        <div class="crm-secret-row">
                            <code class="crm-secret-code" id="crm-secret">${totp.totpSecretEncoded}</code>
                            <button type="button" class="crm-copy-btn" onclick="copySecret()" aria-label="${msg("crm.totp.manual.copy")}">
                                <svg id="crm-copy-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                                </svg>
                                <span id="crm-copy-text">${msg("crm.totp.manual.copy")}</span>
                            </button>
                        </div>
                    </div>
                    <#if totp.policy??>
                    <div class="crm-secret-meta">
                        <div class="crm-meta-item">
                            <span class="crm-meta-key">${msg("crm.totp.manual.type")}</span>
                            <span class="crm-meta-val">${totp.policy.type?upper_case}</span>
                        </div>
                        <div class="crm-meta-item">
                            <span class="crm-meta-key">${msg("crm.totp.manual.algorithm")}</span>
                            <span class="crm-meta-val">${totp.policy.algorithm}</span>
                        </div>
                        <div class="crm-meta-item">
                            <span class="crm-meta-key">${msg("crm.totp.manual.digits")}</span>
                            <span class="crm-meta-val">${totp.policy.digits}</span>
                        </div>
                        <div class="crm-meta-item">
                            <span class="crm-meta-key">${msg("crm.totp.manual.period")}</span>
                            <span class="crm-meta-val">${totp.policy.period}s</span>
                        </div>
                    </div>
                    </#if>
                </div>

                <!-- Verification form -->
                <form id="kc-totp-settings-form" action="${url.loginAction}" method="post" class="crm-totp-form">
                    <div class="crm-field">
                        <label class="crm-label" for="totp">${msg("crm.totp.verifyLabel")}</label>
                        <div class="crm-input-wrapper">
                            <span class="crm-input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                    <path d="M7 11V7a5 5 0 0110 0v4"/>
                                </svg>
                            </span>
                            <input type="text"
                                   id="totp"
                                   name="totp"
                                   class="crm-input crm-input-otp<#if messagesPerField.existsError('totp')> crm-input-error</#if>"
                                   autocomplete="one-time-code"
                                   inputmode="numeric"
                                   pattern="[0-9]*"
                                   maxlength="${totp.policy.digits!6}"
                                   placeholder="${msg("crm.totp.verifyPlaceholder")}"
                                   autofocus
                                   required />
                        </div>
                        <#if messagesPerField.existsError('totp')>
                        <span class="crm-field-error">${kcSanitize(messagesPerField.get('totp'))?no_esc}</span>
                        </#if>
                    </div>

                    <div class="crm-field">
                        <label class="crm-label" for="userLabel">${msg("crm.totp.deviceLabel")}</label>
                        <div class="crm-input-wrapper">
                            <span class="crm-input-icon">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                    <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                                    <line x1="12" y1="18" x2="12" y2="18"/>
                                </svg>
                            </span>
                            <input type="text"
                                   id="userLabel"
                                   name="userLabel"
                                   class="crm-input<#if messagesPerField.existsError('userLabel')> crm-input-error</#if>"
                                   autocomplete="off"
                                   placeholder="${msg("crm.totp.devicePlaceholder")}" />
                        </div>
                        <#if messagesPerField.existsError('userLabel')>
                        <span class="crm-field-error">${kcSanitize(messagesPerField.get('userLabel'))?no_esc}</span>
                        </#if>
                    </div>

                    <#if isAppInitiatedAction??>
                        <input type="hidden" name="logoutOtherSessions" value="on" checked>
                    </#if>

                    <input type="hidden" id="totpSecret" name="totpSecret" value="${totp.totpSecret}" />
                    <#if mode??><input type="hidden" id="mode" name="mode" value="${mode}"/></#if>

                    <div class="crm-button-wrapper crm-totp-actions">
                        <button class="crm-submit-btn" type="submit" id="saveTOTPBtn" name="submitAction" value="Save">
                            ${msg("crm.totp.submit")}
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                        </button>
                        <#if isAppInitiatedAction??>
                        <button class="crm-secondary-btn" type="submit" id="cancelTOTPBtn" name="submitAction" value="Cancel">
                            ${msg("crm.totp.cancel")}
                        </button>
                        </#if>
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
                var menu = document.getElementById('crm-lang-menu');
                if (menu) menu.classList.remove('crm-lang-menu-open');
            }
        });

        function switchTotpTab(which) {
            var qrTab = document.getElementById('crm-tab-qr');
            var manualTab = document.getElementById('crm-tab-manual');
            var qrPanel = document.getElementById('crm-panel-qr');
            var manualPanel = document.getElementById('crm-panel-manual');
            if (which === 'qr') {
                qrTab.classList.add('crm-tab-active'); qrTab.setAttribute('aria-selected', 'true');
                manualTab.classList.remove('crm-tab-active'); manualTab.setAttribute('aria-selected', 'false');
                qrPanel.hidden = false; manualPanel.hidden = true;
            } else {
                manualTab.classList.add('crm-tab-active'); manualTab.setAttribute('aria-selected', 'true');
                qrTab.classList.remove('crm-tab-active'); qrTab.setAttribute('aria-selected', 'false');
                manualPanel.hidden = false; qrPanel.hidden = true;
            }
        }

        function copySecret() {
            var secret = document.getElementById('crm-secret').innerText.trim();
            var txt = document.getElementById('crm-copy-text');
            var icon = document.getElementById('crm-copy-icon');
            var original = txt.innerText;
            navigator.clipboard.writeText(secret).then(function() {
                txt.innerText = '${msg("crm.totp.manual.copied")}';
                icon.innerHTML = '<polyline points="20 6 9 17 4 12"/>';
                setTimeout(function() {
                    txt.innerText = original;
                    icon.innerHTML = '<rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>';
                }, 1800);
            });
        }

        // Auto-trim spaces in OTP input
        var totpInput = document.getElementById('totp');
        if (totpInput) {
            totpInput.addEventListener('input', function(e) {
                e.target.value = e.target.value.replace(/\D+/g, '');
            });
        }
    </script>

    </#if>
</@layout.registrationLayout>
