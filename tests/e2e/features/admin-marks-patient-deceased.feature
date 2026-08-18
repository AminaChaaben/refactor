Feature: Admin marks a patient as deceased

  Scenario Outline: Successful login and marking a patient as deceased
    When I enter "<username>" in the username field
    And I click on "Continue"
    And I enter "<password>" in the password field
    And I click on "Log In"

    When I click on search patient
    And I type "<patient_name>" in the search field
    And I click on "<patient_name>"
    And I click on "Actions"
    And I click on "Mark Patient Deceased"
    And I select "<cause_option>" from the cause of death radio options
    And I enter "<cause_description>" in the non-coded cause of death field
    And I click on "Save and Close"

    Then I should see the patient marked as deceased

    Examples:
      | username | password | patient_name | cause_option | cause_description |
      | admin    | Admin123 | Trevion Noemy Lowe    | Others       | from overwork     |
