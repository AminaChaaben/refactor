Feature: CRM Deals Workspace
  As a sales representative
  I want to manage deals, contacts, and pipeline data
  So that I can track and advance my sales activities efficiently

  Background:
    Given I am on the CRM Deals Workspace page
    And the session badge shows "Session active"

  # ─────────────────────────────────────────
  # DEALS
  # ─────────────────────────────────────────

  @p0 @smoke
  Scenario: View existing deals on load
    Then the deals table should display at least 1 row
    And each row should contain a stage badge, value, owner, and progress bar

  @p0
  Scenario: Add a new deal and verify it appears in the table
    Given I am on the "Deals" tab
    When I click the "New deal" button
    Then a new deal row should appear in the deals table
    And the event log should contain a line matching "Deal created:"
    And the notification count should increase by 1

  @p1
  Scenario: Advance a deal stage and verify async metric update
    Given the Pipeline tab shows an initial average progress value
    And I am on the "Deals" tab
    When I click "Advance" on the first deal row
    Then the stage badge for that deal should change to the next stage
    And after 500ms the Pipeline tab average progress should be updated
    # Testing challenge: metric update is a delayed side effect — assert after explicit wait

  @p1
  Scenario: Event log appends on each deal action
    Given I am on the "Deals" tab
    When I click "New deal" twice
    And I click "Advance" on the first deal row
    Then the event log should contain exactly 3 new entries
    And the last entry should match "Stage advanced"

  # ─────────────────────────────────────────
  # CONTACTS — custom dropdown + async save
  # ─────────────────────────────────────────

  @p0 @smoke
  Scenario: Save a valid contact and verify it appears in the table
    Given I am on the "Contacts" tab
    When I fill in "First name" with "Amina"
    And I fill in "Last name" with "Ben Ali"
    And I open the custom department dropdown
    And I select "Engineering" from the dropdown list
    And I click "Save contact"
    Then a loading spinner should appear in the status area
    And after the spinner disappears the contacts table should contain a row for "Amina Ben Ali"
    And the row status badge should show "active"
    # Testing challenge: save delay is randomised (1200–2000ms) — use waitForSelector not fixed timeout

  @p0
  Scenario: Department dropdown is a custom component — not a native select
    Given I am on the "Contacts" tab
    When I attempt to use selectOption on the department field
    Then it should fail because the dropdown is div-based
    # Testing challenge: must click trigger → wait for list → click item

  @p1
  Scenario: Live validation triggers on input without form submit
    Given I am on the "Contacts" tab
    When I type "A" in the "First name" field
    Then the inline error "Min 2 chars" should appear immediately
    When I type one more character
    Then the inline error should disappear without clicking any button
    # Testing challenge: validation fires on oninput, not on blur or submit

  @p1
  Scenario: Save and notify triggers a notification side effect
    Given I am on the "Contacts" tab
    When I fill in a valid contact form
    And I click "Save & notify"
    Then the notification count in the topbar should increment
    And switching to the "Settings" tab should show the notification in the panel

  @p2
  Scenario: Priority score slider updates the displayed value in real time
    Given I am on the "Contacts" tab
    When I move the priority score slider to 80
    Then the label next to the slider should display "80" immediately

  @p1
  Scenario: Deleting a contact removes it from the table immediately
    Given the contacts table contains at least one contact
    When I click the delete icon on the first contact row
    Then that row should no longer exist in the contacts table

  # ─────────────────────────────────────────
  # PIPELINE — batch async + iframe
  # ─────────────────────────────────────────

  @p0
  Scenario: Batch recalc updates all deal rows asynchronously
    Given I am on the "Pipeline" tab
    And there are 3 deals in the system
    When I click "Run batch"
    Then the batch log should show a "Batch job started" entry
    And each deal should emit a "Recalculated" log entry with staggered timing
    And after all deals are processed the button should re-enable
    And the batch log should end with "Batch complete"
    And the total value and average progress metrics should be updated
    # Testing challenge: results arrive in staggered setTimeout callbacks — must wait for ALL, not first

  @p1
  Scenario: Pipeline metrics reflect deal stage changes
    Given the pipeline total value is recorded
    When I advance a deal stage from the Deals tab
    Then the pipeline total value on the Pipeline tab should be unchanged
    And the average progress should increase

  @p2
  Scenario: Iframe KPI widget updates on internal button click
    Given I am on the "Pipeline" tab
    And the iframe KPI widget is visible
    When I click "Refresh KPI" inside the iframe
    Then the KPI value inside the iframe should change to a numeric string ending in "pts"
    # Testing challenge: element is inside a sandboxed iframe — requires frameLocator(), not page.locator()

  # ─────────────────────────────────────────
  # SETTINGS — dynamic IDs + timed modal
  # ─────────────────────────────────────────

  @p1
  Scenario: Dynamic ID fields regenerate on every render
    Given I am on the "Settings" tab
    When I record the IDs of the three dynamic input fields
    And I click "Re-render fields"
    Then the IDs of the three inputs should all be different from before
    # Testing challenge: targeting by ID will always break — must use label text or nth-child

  @p1
  Scenario: Dynamic fields are targetable by label when IDs change
    Given I am on the "Settings" tab
    When I click "Re-render fields"
    Then I should be able to fill "Config key" using its label locator
    And I should be able to fill "Webhook URL" using its label locator
    And I should be able to fill "API token" using its label locator

  @p0
  Scenario: Delete confirmation button is disabled for 3 seconds
    Given I am on the "Settings" tab
    When I click "Delete account"
    Then the confirmation modal should appear
    And the "Delete" button should be disabled immediately
    And the countdown text should read "Button enables in 3s…"
    When I wait 3 seconds
    Then the "Delete" button should become enabled
    And the countdown text should read "You may now confirm."
    # Testing challenge: clicking Delete immediately will silently do nothing — must wait for countdown

  @p0
  Scenario: Confirming deletion clears all app data
    Given I am on the "Settings" tab
    And there is at least 1 deal and 1 contact in the system
    When I click "Delete account"
    And I wait for the confirm button to become enabled
    And I click "Delete"
    Then the deals table should show "No deals"
    And the contacts table should show "No contacts yet"
    And the pipeline total should show "$0"
    And the notification count should show "0"

  @p1
  Scenario: Cancelling the delete modal restores normal state
    Given I am on the "Settings" tab
    When I click "Delete account"
    And the modal is open
    And I click "Cancel"
    Then the modal should close
    And the deals and contacts data should remain unchanged

  # ─────────────────────────────────────────
  # NOTIFICATIONS
  # ─────────────────────────────────────────

  @p2
  Scenario: Notification bell navigates to settings and shows panel
    Given notifications have been generated by deal and contact actions
    When I click the notification bell icon in the topbar
    Then the Settings tab should become active
    And the notifications panel should be visible
    And the panel should list the most recent notifications in reverse order

  @p2
  Scenario: Notification count accumulates across deal and contact events
    Given the notification count starts at 0
    When I add 2 new deals
    And I save 1 contact with "Save & notify"
    And I run a batch recalc
    Then the notification count should be 4
