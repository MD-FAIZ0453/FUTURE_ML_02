// Global State
let ticketQueue = [];
let categoryChartInstance = null;
let priorityChartInstance = null;

// Design Tokens for Charts
const chartTheme = {
    colors: {
        blue: '#38bdf8',
        violet: '#a78bfa',
        emerald: '#34d399',
        rose: '#fb7185',
        orange: '#fb923c',
        amber: '#f59e0b',
        muted: '#64748b',
        text: '#94a3b8'
    },
    font: "'Inter', sans-serif"
};

// Preset Templates for quick testing
const templates = {
    technical: {
        subject: "Database Connection Error (Internal Server 500)",
        description: "We are receiving continuous connection timeouts when trying to write session records to the main Postgres cluster database from the frontend nodes. The pool capacity is full and we are seeing database driver error connection refused. The production api is currently down."
    },
    billing: {
        subject: "Invoice Dispute - Double Billing Charge #INV-2026-89",
        description: "I noticed on my bank statement that I was charged twice for the Enterprise subscription fee on June 1st. My account invoice dashboard shows only one invoice payment confirmation, but my credit card statement has two transaction logs with the same merchant billing ID."
    },
    cancel: {
        subject: "Request Account Deactivation and Cancellation",
        description: "Hi team, we would like to cancel our team subscription plan starting from next month as our division is merging and we are switching to another tool suite. Please deactivate our account renewals and confirm that no further billing will take place."
    },
    product: {
        subject: "Request for SSO/SAML Integration Support Details",
        description: "We are currently evaluating your platform for our enterprise IT stack and need to confirm if single sign-on (SSO) integration via Okta or Azure AD is supported. If yes, could you provide the SAML metadata URL and user attribute mapping guides?"
    },
    refund: {
        subject: "Refund Request for Accidental Upgrade",
        description: "I accidentally clicked the subscription upgrade button on the billing page and was charged for the annual plan instead of monthly. I upgraded less than 2 hours ago. I want a refund for the price difference and my account reset to monthly billing."
    }
};

// Map Categories to CSS pill class tags
const categoryClassMap = {
    "Technical issue": "cat-technical",
    "Billing inquiry": "cat-billing",
    "Cancellation request": "cat-cancel",
    "Product inquiry": "cat-product",
    "Refund request": "cat-refund"
};

// Map Priorities to CSS pill class tags
const priorityClassMap = {
    "Critical": "priority-pill-critical",
    "High": "priority-pill-high",
    "Medium": "priority-pill-medium",
    "Low": "priority-pill-low"
};

// ====================================================
// INITIALIZATION AND ROUTING
// ====================================================

document.addEventListener("DOMContentLoaded", () => {
    // Current date display
    document.getElementById("current-date").textContent = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Tab Switching Routing
    const navButtons = document.querySelectorAll(".nav-btn");
    navButtons.forEach(btn => {
        btn.addEventListener("click", () => {
            const selectedTab = btn.getAttribute("data-tab");
            switchTab(selectedTab);
        });
    });

    // Setup Live Classifier Form Submission
    const form = document.getElementById("classifier-form");
    if (form) {
        form.addEventListener("submit", handleClassifySubmit);
    }

    // Load initial stats and recent queue tickets
    fetchStats();
});

function switchTab(tabId) {
    // Remove active state from all sidebar nav buttons
    document.querySelectorAll(".nav-btn").forEach(btn => {
        btn.classList.remove("active");
        if (btn.getAttribute("data-tab") === tabId) {
            btn.classList.add("active");
        }
    });

    // Hide all tab content sections
    document.querySelectorAll(".tab-content").forEach(section => {
        section.classList.remove("active-tab");
    });

    // Show selected section
    const targetSection = document.getElementById(`tab-${tabId}`);
    if (targetSection) {
        targetSection.classList.add("active-tab");
    }

    // Update Header Text
    const headerTitle = document.getElementById("page-title");
    const headerSubtitle = document.getElementById("page-subtitle");

    if (tabId === "dashboard") {
        headerTitle.textContent = "Operational Dashboard";
        headerSubtitle.textContent = "Real-time statistics & Support Tickets ML metrics";
    } else if (tabId === "classifier") {
        headerTitle.textContent = "Live Classifier Console";
        headerSubtitle.textContent = "Automatically prioritize and categorize tickets using LinearSVC";
    } else if (tabId === "queue") {
        headerTitle.textContent = "Incident Queue Console";
        headerSubtitle.textContent = "Workflow routing logs and estimated SLAs";
    }
}

// ====================================================
// LOAD PRESET TEMPLATES
// ====================================================
window.loadTemplate = function(type) {
    const data = templates[type];
    if (data) {
        document.getElementById("ticket-subject").value = data.subject;
        document.getElementById("ticket-description").value = data.description;
    }
};

// ====================================================
// API CALLS: STATS AND INITIALIZATION
// ====================================================
function fetchStats() {
    fetch('/api/stats')
        .then(response => response.json())
        .then(res => {
            if (res.status === "success") {
                // Update metrics counters
                document.getElementById("stat-total-tickets").textContent = Number(res.data.total_tickets).toLocaleString();
                
                // Initialize charts
                renderCharts(res.data.category_dist, res.data.priority_dist);
                
                // Store recent tickets in queue
                ticketQueue = res.data.recent_tickets || [];
                renderQueueTable(ticketQueue);
            }
        })
        .catch(err => {
            console.error("Error fetching stats:", err);
        });
}

// ====================================================
// RENDER DATA DISTRIBUTION CHARTS (CHART.JS)
// ====================================================
function renderCharts(categoryDist, priorityDist) {
    // Destroy previous instances if they exist
    if (categoryChartInstance) categoryChartInstance.destroy();
    if (priorityChartInstance) priorityChartInstance.destroy();

    // 1. Category Bar Chart
    const categoryCtx = document.getElementById('categoryChart').getContext('2d');
    const categoryLabels = Object.keys(categoryDist);
    const categoryData = Object.values(categoryDist);

    categoryChartInstance = new Chart(categoryCtx, {
        type: 'bar',
        data: {
            labels: categoryLabels,
            datasets: [{
                label: 'Tickets Volume',
                data: categoryData,
                backgroundColor: [
                    'rgba(56, 189, 248, 0.45)',  // Blue
                    'rgba(245, 158, 11, 0.45)',  // Amber
                    'rgba(251, 113, 133, 0.45)',  // Rose
                    'rgba(52, 211, 153, 0.45)',  // Emerald
                    'rgba(167, 139, 250, 0.45)'  // Violet
                ],
                borderColor: [
                    chartTheme.colors.blue,
                    chartTheme.colors.amber,
                    chartTheme.colors.rose,
                    chartTheme.colors.emerald,
                    chartTheme.colors.violet
                ],
                borderWidth: 1.5,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: chartTheme.colors.text,
                        font: { family: chartTheme.font, size: 10 }
                    }
                },
                y: {
                    grid: { color: 'rgba(255, 255, 255, 0.05)' },
                    ticks: {
                        color: chartTheme.colors.text,
                        font: { family: chartTheme.font, size: 10 }
                    }
                }
            }
        }
    });

    // 2. Priority Doughnut Chart
    const priorityCtx = document.getElementById('priorityChart').getContext('2d');
    const priorityLabels = Object.keys(priorityDist);
    const priorityData = Object.values(priorityDist);

    // Map priorities to colors
    const priorityColorMap = {
        'Critical': chartTheme.colors.rose,
        'High': chartTheme.colors.orange,
        'Medium': chartTheme.colors.amber,
        'Low': chartTheme.colors.emerald
    };
    const priorityBGColorMap = {
        'Critical': 'rgba(251, 113, 133, 0.45)',
        'High': 'rgba(251, 146, 60, 0.45)',
        'Medium': 'rgba(245, 158, 11, 0.45)',
        'Low': 'rgba(52, 211, 153, 0.45)'
    };

    const backgroundColors = priorityLabels.map(label => priorityBGColorMap[label] || 'rgba(255, 255, 255, 0.2)');
    const borderColors = priorityLabels.map(label => priorityColorMap[label] || '#ffffff');

    priorityChartInstance = new Chart(priorityCtx, {
        type: 'doughnut',
        data: {
            labels: priorityLabels,
            datasets: [{
                data: priorityData,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1.5,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: chartTheme.colors.text,
                        font: { family: chartTheme.font, size: 11 },
                        padding: 15
                    }
                }
            }
        }
    });
}

// ====================================================
// LIVE CLASSIFIER INFERENCE
// ====================================================
function handleClassifySubmit(e) {
    e.preventDefault();

    const subjectInput = document.getElementById("ticket-subject");
    const descInput = document.getElementById("ticket-description");
    const submitBtn = document.getElementById("btn-submit-classify");
    
    const subject = subjectInput.value.trim();
    const description = descInput.value.trim();

    if (!subject || !description) return;

    // Show loading spinner
    submitBtn.disabled = true;
    submitBtn.querySelector(".btn-text").textContent = "Vectorizing & Classifying...";
    submitBtn.querySelector(".spinner").classList.remove("hidden");

    fetch('/api/classify', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, description })
    })
    .then(response => response.json())
    .then(res => {
        // Reset button loading state
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-text").textContent = "Classify & Route Ticket";
        submitBtn.querySelector(".spinner").classList.add("hidden");

        if (res.status === "success") {
            const data = res.data;
            
            // Populate active result content
            document.getElementById("result-subject-text").textContent = subject;
            
            // Set predicted category badge with styles
            const catBadge = document.getElementById("result-category-badge");
            catBadge.textContent = data.predictions.category;
            // Clear prior category classes
            catBadge.className = "badge-value-pill"; 
            catBadge.classList.add(categoryClassMap[data.predictions.category] || "cat-technical");

            // Set predicted priority badge with styles
            const priorityBadge = document.getElementById("result-priority-badge");
            priorityBadge.textContent = data.predictions.priority;
            // Clear prior priority classes
            priorityBadge.className = "badge-value-pill"; 
            priorityBadge.classList.add(priorityClassMap[data.predictions.priority] || "priority-pill-low");

            // Operational information
            document.getElementById("result-department").textContent = data.operational.department;
            document.getElementById("result-sla-hours").textContent = `${data.operational.sla_hours} Hour${data.operational.sla_hours > 1 ? 's' : ''}`;

            // Checklist rendering
            const checklistUL = document.getElementById("result-checklist");
            checklistUL.innerHTML = "";
            data.operational.checklist.forEach(item => {
                const li = document.createElement("li");
                li.textContent = item;
                checklistUL.appendChild(li);
            });

            // Metadata info
            document.getElementById("meta-tokens-count").textContent = `${data.meta.cleaned_length} terms`;
            document.getElementById("meta-cleaned-text").textContent = data.meta.cleaned_text;

            // Hide placeholder and show active results card
            document.getElementById("result-placeholder").classList.add("hidden");
            const activeCard = document.getElementById("result-active");
            activeCard.classList.remove("hidden");
            activeCard.style.animation = "fadeIn 0.4s ease";

            // Push to recent queue history
            const newTicket = {
                id: 1000 + ticketQueue.length + 1,
                subject: subject,
                description: description,
                category: data.predictions.category,
                priority: data.predictions.priority,
                status: "Open",
                created_at: new Date().toISOString().split('T')[0]
            };
            
            // Append ticket at the beginning of the queue history
            ticketQueue.unshift(newTicket);
            renderQueueTable(ticketQueue);
            
            // Clear inputs
            subjectInput.value = "";
            descInput.value = "";
        } else {
            alert("API Error: " + res.message);
        }
    })
    .catch(err => {
        // Reset button
        submitBtn.disabled = false;
        submitBtn.querySelector(".btn-text").textContent = "Classify & Route Ticket";
        submitBtn.querySelector(".spinner").classList.add("hidden");
        console.error("Classification error:", err);
        alert("An error occurred during classification. Check console.");
    });
}

// ====================================================
// INCIDENT QUEUE CONSOLE TAB
// ====================================================
function renderQueueTable(tickets) {
    const tbody = document.getElementById("queue-table-body");
    tbody.innerHTML = "";

    if (tickets.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center py-8 text-zinc-500">No support tickets match the filter guidelines.</td></tr>`;
        return;
    }

    tickets.forEach(ticket => {
        const catClass = categoryClassMap[ticket.category] || "cat-technical";
        const priorityClass = priorityClassMap[ticket.priority] || "priority-pill-low";
        
        let slaHours = 24;
        if (ticket.priority === "Critical") slaHours = 1;
        else if (ticket.priority === "High") slaHours = 4;
        else if (ticket.priority === "Medium") slaHours = 12;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>#${ticket.id}</td>
            <td>
                <span class="ticket-subject-cell">${escapeHTML(ticket.subject)}</span>
                <span class="ticket-desc-cell">${escapeHTML(ticket.description)}</span>
            </td>
            <td>
                <span class="badge-value-pill ${catClass}">${ticket.category}</span>
            </td>
            <td>
                <span class="badge-value-pill ${priorityClass}">${ticket.priority}</span>
            </td>
            <td><strong>${slaHours} hr${slaHours > 1 ? 's' : ''}</strong></td>
            <td><span class="status-pill">${ticket.status}</span></td>
            <td>
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 11px;" onclick="viewTicketDetails(${ticket.id})">Inspect</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

window.filterQueue = function() {
    const searchQuery = document.getElementById("queue-search").value.toLowerCase();
    const filterCategory = document.getElementById("filter-category").value;
    const filterPriority = document.getElementById("filter-priority").value;

    const filtered = ticketQueue.filter(ticket => {
        const matchesSearch = ticket.subject.toLowerCase().includes(searchQuery) || 
                              ticket.description.toLowerCase().includes(searchQuery);
        
        const matchesCategory = filterCategory === "all" || ticket.category === filterCategory;
        const matchesPriority = filterPriority === "all" || ticket.priority === filterPriority;

        return matchesSearch && matchesCategory && matchesPriority;
    });

    renderQueueTable(filtered);
};

// ====================================================
// MODAL CONTROLLER
// ====================================================
window.viewTicketDetails = function(ticketId) {
    const ticket = ticketQueue.find(t => t.id === ticketId);
    if (!ticket) return;

    // Fill modal values
    document.getElementById("modal-id-badge").textContent = `TICKET #${ticket.id}`;
    document.getElementById("modal-subject").textContent = ticket.subject;
    document.getElementById("modal-description").textContent = ticket.description;
    
    // Set category badge
    const catBadge = document.getElementById("modal-category-badge");
    catBadge.textContent = ticket.category;
    catBadge.className = "badge-value-pill"; 
    catBadge.classList.add(categoryClassMap[ticket.category] || "cat-technical");

    // Set priority badge
    const priorityBadge = document.getElementById("modal-priority-badge");
    priorityBadge.textContent = ticket.priority;
    priorityBadge.className = "badge-value-pill"; 
    priorityBadge.classList.add(priorityClassMap[ticket.priority] || "priority-pill-low");

    // Routing and SLA details
    let routingDept = "General Support Queue";
    let slaHours = 24;
    
    if (ticket.category === "Technical issue") routingDept = "DevOps & Technical Support Tier 2";
    else if (ticket.category === "Billing inquiry") routingDept = "Accounts & Billing Operations";
    else if (ticket.category === "Cancellation request") routingDept = "Customer Success & Retention";
    else if (ticket.category === "Product inquiry") routingDept = "Product Management & Sales Engineering";
    else if (ticket.category === "Refund request") routingDept = "Finance Operations & Billing";

    if (ticket.priority === "Critical") slaHours = 1;
    else if (ticket.priority === "High") slaHours = 4;
    else if (ticket.priority === "Medium") slaHours = 12;

    document.getElementById("modal-department").textContent = routingDept;
    document.getElementById("modal-sla").textContent = `${slaHours} Hour Response Target`;

    // Show modal overlay
    const modal = document.getElementById("ticket-modal");
    modal.classList.remove("hidden");
};

window.closeModal = function() {
    document.getElementById("ticket-modal").classList.add("hidden");
};

// Helper function to escape HTML special characters
function escapeHTML(str) {
    if (!str) return "";
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}
