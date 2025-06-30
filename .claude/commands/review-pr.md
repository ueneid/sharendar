---
description: Perform an exhaustive pull request review following the detailed guidelines.
---

# PR Review Command for Claude Code

## Command Definition

```yaml
name: review-pr
description: Perform a comprehensive pull request review as a staff engineer with deep domain expertise
parameters:
  - name: pr_number
    description: The pull request number to review
    required: true
    type: integer
```

## Command Instructions

When executing this command, perform an exhaustive pull request review following these detailed guidelines:

### Initial Setup
1. Fetch the PR details using the provided PR number
2. Identify all changed files, additions, deletions, and modifications
3. Read and understand the PR description, linked issues, and commit messages
4. Load the CLAUDE.md file to ensure compliance with project-specific guidelines

### Review Dimensions

#### 1. Architectural Review
- **System Design Impact**: Evaluate how changes affect the overall system architecture
- **Scalability**: Assess if the changes will scale with increased load or data volume
- **Modularity**: Check if the code maintains proper separation of concerns
- **Dependencies**: Review new dependencies for security, maintenance, and licensing concerns
- **Design Patterns**: Verify appropriate use of design patterns and adherence to SOLID principles
- **API Design**: For API changes, ensure backward compatibility and RESTful principles
- **Database Impact**: Review schema changes, query performance, and migration safety

#### 2. Code Quality Analysis
- **Readability**: Ensure code is self-documenting with clear variable/function names
- **Complexity**: Identify overly complex functions (high cyclomatic complexity)
- **DRY Principle**: Check for code duplication that should be refactored
- **Error Handling**: Verify comprehensive error handling and appropriate error messages
- **Input Validation**: Ensure all user inputs are properly validated and sanitized
- **Resource Management**: Check for proper cleanup of resources (connections, files, memory)
- **Concurrency**: Review thread safety and potential race conditions
- **Performance**: Identify potential bottlenecks, N+1 queries, or inefficient algorithms

#### 3. Security Review
- **Authentication/Authorization**: Verify proper access controls are in place
- **Data Exposure**: Check for unintended data leaks in logs, responses, or error messages
- **Injection Vulnerabilities**: Review for SQL, XSS, command injection risks
- **Cryptography**: Ensure proper use of encryption and secure random generation
- **Secrets Management**: Verify no hardcoded secrets or credentials
- **OWASP Top 10**: Check against common web application security risks
- **Third-party Vulnerabilities**: Review dependency versions for known CVEs

#### 4. Testing Assessment
- **Test Coverage**: Verify adequate unit, integration, and e2e test coverage
- **Test Quality**: Ensure tests actually verify behavior, not just code execution
- **Edge Cases**: Check if tests cover boundary conditions and error scenarios
- **Test Maintainability**: Review if tests are clear, isolated, and maintainable
- **Mocking Strategy**: Verify appropriate use of mocks vs real implementations
- **Performance Tests**: For critical paths, ensure performance benchmarks exist
- **Regression Tests**: Verify tests prevent previously fixed bugs from recurring

#### 5. Domain Logic Verification
- **Business Requirements**: Ensure code correctly implements specified requirements
- **Domain Model Integrity**: Verify domain entities maintain valid states
- **Business Rule Compliance**: Check adherence to documented business rules
- **Data Consistency**: Review transactions and data integrity constraints
- **Workflow Logic**: Verify state machines and process flows are correctly implemented
- **Edge Case Handling**: Ensure business edge cases are properly addressed

#### 6. Documentation Review
- **Code Comments**: Verify complex logic has explanatory comments
- **API Documentation**: Ensure endpoints, parameters, and responses are documented
- **README Updates**: Check if setup instructions or architecture docs need updates
- **CHANGELOG**: Verify user-facing changes are documented
- **Migration Guides**: For breaking changes, ensure migration documentation exists
- **Inline TODOs**: Review any TODO comments for technical debt tracking

#### 7. Operational Readiness
- **Logging**: Verify appropriate logging levels and useful log messages
- **Monitoring**: Check if new metrics or alerts should be added
- **Feature Flags**: For risky changes, verify feature flag implementation
- **Rollback Strategy**: Ensure changes can be safely rolled back
- **Configuration**: Review new configuration parameters and defaults
- **Deployment Considerations**: Check for required infrastructure changes

#### 8. Performance Analysis
- **Algorithm Efficiency**: Review time and space complexity of algorithms
- **Database Queries**: Analyze query execution plans and index usage
- **Caching Strategy**: Verify appropriate use of caching layers
- **Memory Usage**: Check for memory leaks or excessive allocations
- **Network Calls**: Review external API calls for timeout and retry logic
- **Batch Processing**: For bulk operations, ensure efficient batching

#### 9. Compliance Checks
- **Coding Standards**: Verify adherence to team's style guide and linting rules
- **License Compatibility**: Check new dependencies for license conflicts
- **Privacy Regulations**: Ensure GDPR, CCPA compliance where applicable
- **Accessibility**: For UI changes, verify WCAG compliance
- **Internationalization**: Check proper handling of locales and translations

#### 10. CLAUDE.md Verification
- **Project Guidelines**: Cross-reference all changes against CLAUDE.md specifications
- **Custom Rules**: Verify compliance with project-specific conventions
- **Workflow Adherence**: Ensure PR follows documented development workflow
- **Team Standards**: Check against team-specific quality gates defined in CLAUDE.md

### Review Output Format

Structure your review with the following sections:

1. **Summary**: High-level assessment of the PR
2. **Critical Issues**: Must-fix problems blocking approval
3. **Major Concerns**: Significant issues that should be addressed
4. **Minor Suggestions**: Nice-to-have improvements
5. **Positive Feedback**: Highlight well-implemented aspects
6. **Questions**: Clarifications needed from the author
7. **CLAUDE.md Compliance**: Specific adherence or violations noted

### Review Tone and Approach

- Be constructive and educational in feedback
- Provide specific examples and suggest alternatives
- Acknowledge good practices and improvements
- Prioritize feedback by impact and importance
- Consider the PR author's experience level
- Focus on code, not the person
- Explain the "why" behind each suggestion

### Example Usage

```bash
/review-pr 1234
```

This will initiate a comprehensive review of PR #1234, analyzing all aspects mentioned above and providing structured feedback to help improve code quality and maintain project standards.