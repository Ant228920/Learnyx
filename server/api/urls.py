from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import LoginView, TokenRefreshView
from api.views import (
    RegistrationRequestView,
    ApproveRegistrationRequestView,
    ApplicantRejectView,
    PackagePlanListView,
    ActivatePackageView,
    StudentBalanceView,
    SlotViewSet,
    LessonViewSet,
    BonusBalanceView,
    StudentListView,
    TeacherListView,
    StudentDashboardView,
    TeacherDashboardView,
    JournalListView,
    AvailableStudentListView,
    LessonArchiveView,
    PackagePurchaseView,
    ProfileView,
    TeacherFinancesView,
    ManagerSubscriptionsView,
    StudentWalletView,
    StudentBalanceTopUpView,
    StudentLearningRequestView,
    ManagerLearningRequestsView,
    ReviewView,
    StudentReportView,
    ComplaintListCreateView,
    ComplaintDetailView,
    LessonMaterialView,
    HomeworkDetailView,
    HomeworkSubmitView,
)
router = DefaultRouter()
router.register(r'v1/slots', SlotViewSet, basename='slot')
router.register(r'v1/lessons', LessonViewSet, basename='lesson')

urlpatterns = [
    # ── Auth (canonical)
    path('v1/auth/login/', LoginView.as_view(), name='auth-login'),
    path('v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('v1/auth/register/', RegistrationRequestView.as_view(), name='auth-register'),
    path('v1/applicants/', RegistrationRequestView.as_view(), name='applicants-list'),
    path('v1/applicants/<int:pk>/approve/', ApproveRegistrationRequestView.as_view(), name='approve-applicant'),
    path('v1/applicants/<int:pk>/reject/', ApplicantRejectView.as_view(), name='applicant-reject'),

    # ── Packages & Students
    path('v1/packages/', PackagePlanListView.as_view(), name='package-plans'),
    path('v1/packages/<int:pk>/activate/', ActivatePackageView.as_view(), name='activate-package'),
    path('v1/packages/<int:pk>/purchase/', PackagePurchaseView.as_view(), name='package-purchase'),
    path('v1/students/available/', AvailableStudentListView.as_view(), name='student-available'),
    path('v1/students/', StudentListView.as_view(), name='student-list'),
    path('v1/students/me/balance/', StudentBalanceView.as_view(), name='student-balance'),
    path('v1/teachers/', TeacherListView.as_view(), name='teacher-list'),

    # ── Bonus / cashback
    path('v1/bonus/balance/<int:student_id>/', BonusBalanceView.as_view(), name='bonus-balance'),

    # ── Dashboards
    path('v1/student/dashboard/', StudentDashboardView.as_view(), name='student-dashboard'),
    path('v1/teacher/dashboard/', TeacherDashboardView.as_view(), name='teacher-dashboard'),

    # ── Manager archive
    path('v1/admin/lessons/archive/', LessonArchiveView.as_view(), name='lesson-archive'),

    # ── Journal
    path('v1/journal/', JournalListView.as_view(), name='journal-list'),

    # ── Profile
    path('v1/profile/', ProfileView.as_view(), name='profile'),

    # ── Teacher finances & Manager subscriptions
    path('v1/teacher/finances/', TeacherFinancesView.as_view(), name='teacher-finances'),
    path('v1/manager/subscriptions/', ManagerSubscriptionsView.as_view(), name='manager-subscriptions'),

    # ── Student wallet
    path('v1/students/me/wallet/', StudentWalletView.as_view(), name='student-wallet'),
    path('v1/students/me/topup/', StudentBalanceTopUpView.as_view(), name='student-topup'),

    # ── Learning requests
    path('v1/students/me/learning-requests/', StudentLearningRequestView.as_view(), name='student-learning-requests'),
    path('v1/manager/learning-requests/', ManagerLearningRequestsView.as_view(), name='manager-learning-requests'),
    path('v1/manager/learning-requests/<int:pk>/', ManagerLearningRequestsView.as_view(), name='manager-learning-request-detail'),

    # ── Student report
    path('v1/student/report/', StudentReportView.as_view(), name='student-report'),

    # ── Reviews
    path('v1/reviews/', ReviewView.as_view(), name='reviews'),

    # ── Complaints
    path('v1/complaints/', ComplaintListCreateView.as_view(), name='complaint-list'),
    path('v1/complaints/<int:pk>/', ComplaintDetailView.as_view(), name='complaint-detail'),

    # ── Lesson materials
    path('v1/lessons/<int:lesson_id>/materials/', LessonMaterialView.as_view(), name='lesson-materials'),

    # ── Homework (LEAR-74)
    path('v1/homeworks/<int:pk>/', HomeworkDetailView.as_view(), name='homework-detail'),
    path('v1/homeworks/<int:pk>/submit/', HomeworkSubmitView.as_view(), name='homework-submit'),

    # ── ViewSets
    path('', include(router.urls)),
]
