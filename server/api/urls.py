from django.urls import path, include
from rest_framework.routers import DefaultRouter
from users.views import LoginView, TokenRefreshView, RequestViewSet
import api.views
router = DefaultRouter()
router.register(r'v1/slots', api.views.SlotViewSet, basename='slot')
router.register(r'v1/lessons', api.views.LessonViewSet, basename='lesson')
router.register(r'v1/requests', RequestViewSet, basename='request')

urlpatterns = [
    # ── Auth (canonical)
    path('v1/auth/login/', LoginView.as_view(), name='auth-login'),
    path('v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('v1/auth/register/', api.views.RegistrationRequestView.as_view(), name='auth-register'),
    path('v1/applicants/', api.views.RegistrationRequestView.as_view(), name='applicants-list'),
    path('v1/applicants/<int:pk>/approve/', api.views.ApproveRegistrationRequestView.as_view(), name='approve-applicant'),
    path('v1/applicants/<int:pk>/reject/', api.views.ApplicantRejectView.as_view(), name='applicant-reject'),

    # ── Packages & Students
    path('v1/packages/', api.views.PackagePlanListView.as_view(), name='package-plans'),
    path('v1/packages/<int:pk>/activate/', api.views.ActivatePackageView.as_view(), name='activate-package'),
    path('v1/packages/<int:pk>/purchase/', api.views.PackagePurchaseView.as_view(), name='package-purchase'),
    path('v1/packages/<int:pk>/cancel/', api.views.PackageCancelView.as_view(), name='package-cancel'),
    path('v1/package-plans/', api.views.PackagePlanCatalogView.as_view(), name='package-plan-catalog'),
    path('v1/package-plans/<int:pk>/purchase/', api.views.PackagePlanPurchaseView.as_view(), name='package-plan-purchase'),
    path('v1/students/available/', api.views.AvailableStudentListView.as_view(), name='student-available'),
    path('v1/students/', api.views.StudentListView.as_view(), name='student-list'),
    path('v1/students/me/balance/', api.views.StudentBalanceView.as_view(), name='student-balance'),
    path('v1/teachers/', api.views.TeacherListView.as_view(), name='teacher-list'),

    # ── Bonus / cashback
    path('v1/bonus/balance/<int:student_id>/', api.views.BonusBalanceView.as_view(), name='bonus-balance'),

    # ── Dashboards
    path('v1/student/dashboard/', api.views.StudentDashboardView.as_view(), name='student-dashboard'),
    path('v1/teacher/dashboard/', api.views.TeacherDashboardView.as_view(), name='teacher-dashboard'),

    # ── Manager archive
    path('v1/admin/lessons/archive/', api.views.LessonArchiveView.as_view(), name='lesson-archive'),

    # ── Journal
    path('v1/journal/', api.views.JournalListView.as_view(), name='journal-list'),

    # ── Profile
    path('v1/profile/', api.views.ProfileView.as_view(), name='profile'),

    # ── Teacher finances & Manager subscriptions
    path('v1/teacher/finances/', api.views.TeacherFinancesView.as_view(), name='teacher-finances'),
    path('v1/manager/subscriptions/', api.views.ManagerSubscriptionsView.as_view(), name='manager-subscriptions'),

    # ── Student wallet
    path('v1/students/me/wallet/', api.views.StudentWalletView.as_view(), name='student-wallet'),
    path('v1/students/me/topup/', api.views.StudentBalanceTopUpView.as_view(), name='student-topup'),

    # ── Learning requests
    path('v1/students/me/learning-requests/', api.views.StudentLearningRequestView.as_view(), name='student-learning-requests'),
    path('v1/manager/learning-requests/', api.views.ManagerLearningRequestsView.as_view(), name='manager-learning-requests'),
    path('v1/manager/learning-requests/<int:pk>/', api.views.ManagerLearningRequestsView.as_view(), name='manager-learning-request-detail'),

    # ── Student report
    path('v1/student/report/', api.views.StudentReportView.as_view(), name='student-report'),

    # ── Reviews
    path('v1/reviews/', api.views.ReviewView.as_view(), name='reviews'),

    # ── Complaints
    path('v1/complaints/', api.views.ComplaintListCreateView.as_view(), name='complaint-list'),
    path('v1/complaints/<int:pk>/', api.views.ComplaintDetailView.as_view(), name='complaint-detail'),

    # ── Lesson materials
    path('v1/lessons/<int:lesson_id>/materials/', api.views.LessonMaterialView.as_view(), name='lesson-materials'),

    # ── Homework (LEAR-74)
    path('v1/homeworks/<int:pk>/', api.views.HomeworkDetailView.as_view(), name='homework-detail'),
    path('v1/homeworks/<int:pk>/submit/', api.views.HomeworkSubmitView.as_view(), name='homework-submit'),

    # ── User requests alias (student POST, manager GET — same resource, frontend uses two paths)
    path('v1/user-requests/', RequestViewSet.as_view({'get': 'list', 'post': 'create'}), name='user-requests'),

    # ── ViewSets
    path('', include(router.urls)),
]
