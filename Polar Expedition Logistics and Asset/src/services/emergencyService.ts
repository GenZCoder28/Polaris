import { 
  EmergencyRecord, 
  ResponseTeam, 
  EmergencyStats, 
  EmergencyType, 
  EmergencySeverity, 
  EmergencyStatus,
  ResponseTeamAvailability,
  EmergencyActionRecord
} from '../types.ts';

class EmergencyService {
  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      'x-user-role': 'Station Commander',
      'x-user-name': 'Dr. K. Swaminathan (Station Commander)',
      'x-user-email': 'commander.bharati@ncpor.gov.in',
    };
  }

  // 1. Fetch emergencies list with filters
  public async getEmergencies(filter: {
    status?: string;
    severity?: string;
    station_id?: string;
    vessel_id?: string;
    emergency_type?: string;
    source?: string;
    q?: string;
  } = {}): Promise<EmergencyRecord[]> {
    const params = new URLSearchParams();
    if (filter && typeof filter === 'object') {
      Object.entries(filter).forEach(([k, v]) => {
        if (v && v !== 'ALL') params.append(k, v);
      });
    }

    const res = await fetch(`/api/emergencies?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch emergencies');
    return res.json();
  }

  // 2. Fetch emergency statistics
  public async getStats(): Promise<EmergencyStats> {
    const res = await fetch('/api/emergencies/stats');
    if (!res.ok) throw new Error('Failed to fetch emergency stats');
    return res.json();
  }

  // 3. Fetch response teams
  public async getResponseTeams(stationId?: string, availableOnly = false): Promise<ResponseTeam[]> {
    const params = new URLSearchParams();
    if (stationId && stationId !== 'ALL') params.append('station_id', stationId);
    if (availableOnly) params.append('available_only', 'true');

    const res = await fetch(`/api/emergencies/teams?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch response teams');
    return res.json();
  }

  // 4. Update response team availability
  public async updateResponseTeamStatus(
    teamId: string,
    status: ResponseTeamAvailability
  ): Promise<ResponseTeam> {
    const res = await fetch(`/api/emergencies/teams/${teamId}/status`, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify({ status }),
    });
    if (!res.ok) throw new Error('Failed to update response team status');
    return res.json();
  }

  // 5. Get emergency detail
  public async getEmergencyById(id: string): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}`);
    if (!res.ok) throw new Error('Failed to fetch emergency details');
    return res.json();
  }

  // 6. Get full history and audit log
  public async getEmergencyHistory(id: string): Promise<any> {
    const res = await fetch(`/api/emergencies/${id}/history`);
    if (!res.ok) throw new Error('Failed to fetch emergency history');
    return res.json();
  }

  // 7. Create generic emergency
  public async createEmergency(data: {
    source: 'PERSONNEL' | 'WEATHER' | 'SYSTEM';
    emergency_type: EmergencyType;
    severity?: EmergencySeverity;
    reported_by: string;
    affected_personnel_name?: string;
    affected_personnel_id?: string;
    station_id?: string;
    vessel_id?: string;
    location?: string;
    description: string;
  }): Promise<EmergencyRecord> {
    const res = await fetch('/api/emergencies', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create emergency');
    }
    return res.json();
  }

  // 8. Personnel-initiated SOS emergency
  public async createPersonnelEmergency(data: {
    personnel_name?: string;
    personnel_id?: string;
    emergency_type: EmergencyType;
    description?: string;
    fallback_station_id?: string;
    fallback_location?: string;
  }): Promise<EmergencyRecord> {
    const res = await fetch('/api/emergencies/personnel', {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create personnel emergency');
    }
    return res.json();
  }

  // 9. Acknowledge emergency
  public async acknowledgeEmergency(
    id: string,
    acknowledgedBy?: string,
    notes?: string
  ): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/acknowledge`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ acknowledged_by: acknowledgedBy, notes }),
    });
    if (!res.ok) throw new Error('Failed to acknowledge emergency');
    return res.json();
  }

  // 10. Assign response team
  public async assignResponseTeam(
    id: string,
    responseTeamId: string,
    notes?: string
  ): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/assign`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ response_team_id: responseTeamId, notes }),
    });
    if (!res.ok) throw new Error('Failed to assign response team');
    return res.json();
  }

  // 11. Accept response
  public async acceptResponse(
    id: string,
    responderName?: string,
    notes?: string
  ): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/accept`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ responder_name: responderName, notes }),
    });
    if (!res.ok) throw new Error('Failed to accept response');
    return res.json();
  }

  // 12. Reject response assignment
  public async rejectResponse(
    id: string,
    reason: string,
    responderName?: string
  ): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/reject`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason, responder_name: responderName }),
    });
    if (!res.ok) throw new Error('Failed to reject response assignment');
    return res.json();
  }

  // 13. Record action in log
  public async recordAction(
    id: string,
    actionType: EmergencyActionRecord['action_type'],
    description: string,
    performedBy?: string
  ): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/actions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ action_type: actionType, description, performed_by: performedBy }),
    });
    if (!res.ok) throw new Error('Failed to record action');
    return res.json();
  }

  // 14. Escalate emergency
  public async escalateEmergency(id: string, reason?: string): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/escalate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ reason }),
    });
    if (!res.ok) throw new Error('Failed to escalate emergency');
    return res.json();
  }

  // 15. Resolve emergency
  public async resolveEmergency(
    id: string,
    resolutionSummary: string,
    notes?: string
  ): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/resolve`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ resolution_summary: resolutionSummary, notes }),
    });
    if (!res.ok) throw new Error('Failed to resolve emergency');
    return res.json();
  }

  // 16. Cancel emergency (false alarm)
  public async cancelEmergency(id: string, cancellationReason: string): Promise<EmergencyRecord> {
    const res = await fetch(`/api/emergencies/${id}/cancel`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ cancellation_reason: cancellationReason }),
    });
    if (!res.ok) throw new Error('Failed to cancel emergency');
    return res.json();
  }
}

export const emergencyService = new EmergencyService();
