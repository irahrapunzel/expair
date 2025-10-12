# Fix for migration 0007 which had managed=False
# This creates the supptix_tbl table in fresh databases

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0009_alter_supportticket_options_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
            CREATE TABLE IF NOT EXISTS supptix_tbl (
                ticket_id SERIAL PRIMARY KEY,
                ticket_name VARCHAR(255),
                ticket_email VARCHAR(255),
                ticket_title VARCHAR(255),
                ticket_desc TEXT,
                ticket_pic TEXT,
                ticket_datesubmitted TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
            );
            """,
            reverse_sql="DROP TABLE IF EXISTS supptix_tbl;",
            state_operations=[]  # Don't modify Django's internal state
        ),
    ]