<#import "template.ftl" as layout>
<@layout.registrationLayout displayMessage=false displayInfo=false; section>

    <#if section = "header">
    <#elseif section = "form">

    <div class="shofy-page-wrapper">
        <div class="shofy-bg-shapes">
            <div class="shofy-shape shofy-shape-1"></div>
            <div class="shofy-shape shofy-shape-2"></div>
        </div>

        <div class="shofy-login-card shofy-info-card">

            <div class="shofy-info-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#0989FF" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
            </div>

            <h2 class="shofy-form-title shofy-info-title">${msg("shofy.verifyEmail.title")}</h2>

            <p class="shofy-info-message">
                ${msg("emailVerifyInstruction1", user.email)}
            </p>
            <p class="shofy-info-message shofy-info-hint">
                ${msg("shofy.verifyEmail.notReceived")}
            </p>

            <div class="shofy-info-actions">
                <a href="${url.loginAction}" class="shofy-submit-btn shofy-info-btn">
                    ${msg("shofy.verifyEmail.resendBtn")}
                </a>
            </div>

            <#if client?? && client.baseUrl?has_content>
            <div class="shofy-back-link">
                <a href="${client.baseUrl}">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="15 18 9 12 15 6"/>
                    </svg>
                    <span>${msg("shofy.info.backToHome")}</span>
                </a>
            </div>
            </#if>
        </div>
    </div>

    </#if>
</@layout.registrationLayout>
