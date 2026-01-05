from datetime import datetime
from typing import Any, List, Optional

from pydantic import BaseModel, Field

# reference: https://webservices2.autotask.net/atservicesrest/swagger/ui/index#/Tickets


class TicketDetails(BaseModel):
    id: int
    apiVendorID: Optional[int] = None
    assignedResourceID: Optional[int] = None
    assignedResourceRoleID: Optional[int] = None
    billingCodeID: int
    changeApprovalBoard: Optional[str] = None
    changeApprovalStatus: Optional[str] = None
    changeApprovalType: Optional[str] = None
    changeInfoField1: str = ""
    changeInfoField2: str = ""
    changeInfoField3: str = ""
    changeInfoField4: str = ""
    changeInfoField5: str = ""
    companyID: int
    companyLocationID: int
    completedByResourceID: Optional[int] = None
    completedDate: Optional[datetime] = None
    configurationItemID: Optional[int] = None
    contactID: Optional[int] = None
    contractID: Optional[int] = None
    contractServiceBundleID: Optional[int] = None
    contractServiceID: Optional[int] = None
    createDate: datetime
    createdByContactID: Optional[int] = None
    creatorResourceID: int
    creatorType: int
    currentServiceThermometerRating: Optional[int] = None
    description: Optional[str] = None
    dueDateTime: datetime
    estimatedHours: Optional[float] = None
    externalID: str = ""
    firstResponseAssignedResourceID: Optional[int] = None
    firstResponseDateTime: Optional[datetime] = None
    firstResponseDueDateTime: Optional[datetime] = None
    firstResponseInitiatingResourceID: Optional[int] = None
    hoursToBeScheduled: Optional[float] = None
    impersonatorCreatorResourceID: Optional[int] = None
    isAssignedToComanaged: bool
    issueType: int
    isVisibleToComanaged: bool
    lastActivityDate: datetime
    lastActivityPersonType: int
    lastActivityResourceID: int
    lastCustomerNotificationDateTime: Optional[datetime] = None
    lastCustomerVisibleActivityDateTime: Optional[datetime] = None
    lastTrackedModificationDateTime: datetime
    monitorID: Optional[int] = None
    monitorTypeID: Optional[int] = None
    opportunityID: Optional[int] = None
    organizationalLevelAssociationID: Optional[int] = None
    previousServiceThermometerRating: Optional[int] = None
    priority: int
    problemTicketId: Optional[int] = None
    projectID: Optional[int] = None
    purchaseOrderNumber: str = ""
    queueID: int
    resolution: str = ""
    resolutionPlanDateTime: Optional[datetime] = None
    resolutionPlanDueDateTime: Optional[datetime] = None
    resolvedDateTime: Optional[datetime] = None
    resolvedDueDateTime: Optional[datetime] = None
    rmaStatus: Optional[str] = None
    rmaType: Optional[str] = None
    rmmAlertID: Optional[int] = None
    serviceLevelAgreementHasBeenMet: Optional[bool] = None
    serviceLevelAgreementID: int
    serviceLevelAgreementPausedNextEventHours: Optional[float] = None
    serviceThermometerTemperature: Optional[int] = None
    source: int
    status: int
    subIssueType: int
    ticketCategory: int
    ticketNumber: str
    ticketType: int
    title: str
    userDefinedFields: List[Any] = []


class TicketsFetch(BaseModel):
    id: int
    status: int
    ticketNumber: str
    title: str
    priority: int
    link: str
    createDate: datetime
    creatorResourceID: int


class TicketCompleteRequest(BaseModel):
    ticket_id: int = Field(..., description="ID of the ticket to be updated")
    chat: str = Field(
        ..., description="The Chat conversation to update the resolution in autotask"
    )
