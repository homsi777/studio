
1. Tables Summary
Table Name	Rows Estimate	Purpose
menu_items	3	Stores restaurant menu items and their details
expenses	0	Tracks operational expenses
tables	9	Manages restaurant table information
customer_sessions	0	Tracks customer browsing sessions per table
orders	0	Represents customer orders and their status
user_profiles	0	Stores detailed user profile information
2. Detailed Table Schemas
2.1 menu_items Table
Column	Type	Nullable	Constraints	Default
id	uuid	NOT NULL	PRIMARY KEY	gen_random_uuid()
created_at	timestamp with time zone	NOT NULL	-	now()
updated_at	timestamp with time zone	NOT NULL	-	now()
name	text	NOT NULL	-	-
name_en	text	NULLABLE	-	-
description	text	NULLABLE	-	-
description_en	text	NULLABLE	-	-
price	numeric	NOT NULL	price >= 0	-
category	text	NOT NULL	IN ('main', 'appetizer', 'drink', 'dessert')	-
is_available	boolean	NOT NULL	-	true
offer	text	NULLABLE	-	-
offer_en	text	NULLABLE	-	-
image	text	NULLABLE	-	-
image_hint	text	NULLABLE	-	-
2.2 expenses Table
Column	Type	Nullable	Constraints	Default
id	uuid	NOT NULL	PRIMARY KEY	gen_random_uuid()
created_at	timestamp with time zone	NOT NULL	-	now()
last_updated	timestamp with time zone	NOT NULL	-	now()
description	text	NOT NULL	-	-
description_en	text	NULLABLE	-	-
amount	numeric	NOT NULL	amount > 0	-
date	date	NOT NULL	-	-
category	text	NOT NULL	IN ('rent', 'bills', 'salaries', 'supplies', 'maintenance', 'other')	-
payment_method	text	NULLABLE	-	-
supplier	text	NULLABLE	-	-
invoice_number	text	NULLABLE	-	-
notes	text	NULLABLE	-	-
user_id	uuid	NULLABLE	REFERENCES auth.users(id)	-
2.3 tables Table
Column	Type	Nullable	Constraints	Default
uuid	uuid	NOT NULL	PRIMARY KEY, UNIQUE	gen_random_uuid()
is_active	boolean	NOT NULL	-	true
display_number	text	NULLABLE	-	-
capacity	integer	NULLABLE	capacity > 0	-
status	table_status	NULLABLE	IN ('available', 'occupied', 'needs_cleaning', 'reserved')	'available'
current_order_id	uuid	NULLABLE	REFERENCES orders(id)	-
assigned_user_id	uuid	NULLABLE	REFERENCES auth.users(id)	-
2.4 customer_sessions Table
Column	Type	Nullable	Constraints	Default
id	uuid	NOT NULL	PRIMARY KEY	gen_random_uuid()
table_uuid	uuid	NOT NULL	REFERENCES tables(uuid)	-
created_at	timestamp with time zone	NOT NULL	-	now()
2.5 orders Table
Column	Type	Nullable	Constraints	Default
id	uuid	NOT NULL	PRIMARY KEY	gen_random_uuid()
created_at	timestamp with time zone	NOT NULL	-	now()
session_id	uuid	NOT NULL	REFERENCES customer_sessions(id)	-
table_uuid	uuid	NOT NULL	-	-
table_id	integer	NOT NULL	-	-
items	jsonb	NOT NULL	-	-
status	text	NOT NULL	-	'pending_chef_approval'
subtotal	numeric	NOT NULL	-	-
service_charge	numeric	NOT NULL	-	0
tax	numeric	NOT NULL	-	0
final_total	numeric	NOT NULL	-	-
chef_approved_at	timestamp with time zone	NULLABLE	-	-
cashier_approved_at	timestamp with time zone	NULLABLE	-	-
customer_confirmed_at	timestamp with time zone	NULLABLE	-	-
completed_at	timestamp with time zone	NULLABLE	-	-
2.6 user_profiles Table
Column	Type	Nullable	Constraints	Default
user_id	uuid	NOT NULL	PRIMARY KEY, REFERENCES auth.users(id)	-
full_name	text	NOT NULL	-	-
phone_number	text	NULLABLE	-	-
role	user_role	NOT NULL	IN ('admin', 'manager', 'chef', 'accountant', 'waiter', 'cashier')	-
is_active	boolean	NULLABLE	-	true
hire_date	timestamp with time zone	NULLABLE	-	CURRENT_TIMESTAMP
last_login	timestamp with time zone	NULLABLE	-	-
profile_image_url	text	NULLABLE	-	-
salary	numeric	NULLABLE	-	-
department	text	NULLABLE	-	-
created_at	timestamp with time zone	NULLABLE	-	CURRENT_TIMESTAMP
updated_at	timestamp with time zone	NULLABLE	-	CURRENT_TIMESTAMP
3. Enum Types
3.1 table_status
available
occupied
needs_cleaning
reserved
3.2 user_role
admin
manager
chef
accountant
waiter
cashier
4. Relationships
expenses.user_id → auth.users.id
tables.assigned_user_id → auth.users.id
tables.current_order_id → orders.id
customer_sessions.table_uuid → tables.uuid
orders.session_id → customer_sessions.id
user_profiles.user_id → auth.users.id

