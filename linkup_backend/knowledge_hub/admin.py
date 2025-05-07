from django.contrib import admin
from .models import Tag, Article, ArticleLike, ArticleComment, ArticleBookmark, ArticleMedia

@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display = ('name', 'is_predefined', 'created_at')
    search_fields = ('name',)
    list_filter = ('is_predefined',)

@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'view_count', 'created_at', 'is_published')
    search_fields = ('title', 'content')
    list_filter = ('is_published', 'created_at')
    filter_horizontal = ('tags',)

@admin.register(ArticleLike)
class ArticleLikeAdmin(admin.ModelAdmin):
    list_display = ('article', 'user', 'created_at')
    search_fields = ('article__title', 'user__username')

@admin.register(ArticleComment)
class ArticleCommentAdmin(admin.ModelAdmin):
    list_display = ('article', 'author', 'created_at')
    search_fields = ('article__title', 'author__username', 'content')
    list_filter = ('created_at',)

@admin.register(ArticleBookmark)
class ArticleBookmarkAdmin(admin.ModelAdmin):
    list_display = ('article', 'user', 'created_at')
    search_fields = ('article__title', 'user__username')

@admin.register(ArticleMedia)
class ArticleMediaAdmin(admin.ModelAdmin):
    list_display = ('article', 'media_type', 'created_at')
    search_fields = ('article__title',)
    list_filter = ('media_type',)
