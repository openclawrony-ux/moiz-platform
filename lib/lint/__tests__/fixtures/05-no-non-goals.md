# Internal API PRD

## Problem

Engineers wait 4 hours for staging environments to provision. The wait blocks code review.

## Target user

Backend engineers on the platform team (12 people).

## User stories

- As an engineer, I want a fresh staging environment in under 5 minutes so that I can verify my PR.
- As a release manager, I want a queue view so that I can see capacity at a glance.
- As an SRE, I want auto-cleanup of idle environments so that we do not run out of compute.

## Success metric

Median provisioning time will drop from 4 hours to under 5 minutes within 6 weeks.
