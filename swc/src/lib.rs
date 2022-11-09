use swc_core::{
    common::DUMMY_SP,
    ecma::{
        ast::{
            ArrowExpr, AssignPatProp, BindingIdent, BlockStmtOrExpr, CallExpr, Callee, Expr,
            ExprOrSpread, Ident, ImportDecl, ImportSpecifier, MemberExpr, MemberProp, ModuleDecl,
            ModuleItem, ObjectPat, ObjectPatProp, Pat, Program, TaggedTpl,
        },
        atoms::JsWord,
        transforms::testing::test,
        visit::{Fold, FoldWith},
    },
    plugin::{plugin_transform, proxies::TransformPluginProgramMetadata},
};

pub struct FetchMacro {
    import_specifier: String,
}

fn ident(value: String) -> Ident {
    Ident {
        span: DUMMY_SP,
        sym: JsWord::from(value),
        optional: false,
    }
}

fn pat_bind_indent(value: String) -> Pat {
    Pat::Ident(BindingIdent {
        id: ident(value),
        type_ann: None,
    })
}

fn args_of_fetch(arg: ExprOrSpread) -> Vec<ExprOrSpread> {
    vec![
        // @TODO parse string url to be object params
        arg,
        ExprOrSpread {
            spread: None,
            expr: Box::new(Expr::Ident(ident("opts".to_string()))),
        },
    ]
}

fn arrow_obj_pattern(prop: String) -> Expr {
    let identifier = ident(prop);

    Expr::Arrow(ArrowExpr {
        span: DUMMY_SP,
        params: vec![Pat::Object(ObjectPat {
            span: DUMMY_SP,
            props: vec![ObjectPatProp::Assign(AssignPatProp {
                span: DUMMY_SP,
                key: identifier.to_owned(),
                value: None,
            })],
            optional: false,
            type_ann: None,
        })],
        body: BlockStmtOrExpr::Expr(Box::new(Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(Box::new(Expr::Ident(identifier.to_owned()))),
            args: vec![],
            type_args: None,
        }))),
        is_async: false,
        is_generator: false,
        type_params: None,
        return_type: None,
    })
}

impl FetchMacro {
    pub fn new() -> Self {
        FetchMacro {
            import_specifier: String::new(),
        }
    }

    fn replace_with_fetch_function(
        &mut self,
        args: Vec<ExprOrSpread>,
        member_call: Option<MemberExpr>,
    ) -> Expr {
        let default_expr = Expr::Call(CallExpr {
            span: DUMMY_SP,
            callee: Callee::Expr(Box::new(Expr::Ident(ident("fetch".to_string())))),
            args,
            type_args: None,
        });
        Expr::Arrow(ArrowExpr {
            span: DUMMY_SP,
            params: vec![pat_bind_indent("opts".to_string())],
            body: BlockStmtOrExpr::Expr(Box::new(match member_call {
                Some(MemberExpr {
                    prop: MemberProp::Ident(Ident { sym, .. }),
                    ..
                }) => Expr::Call(CallExpr {
                    span: DUMMY_SP,
                    callee: Callee::Expr(Box::new(Expr::Member(MemberExpr {
                        span: DUMMY_SP,
                        obj: Box::new(default_expr),
                        prop: MemberProp::Ident(ident("then".to_string())),
                    }))),

                    args: vec![ExprOrSpread {
                        spread: None,
                        expr: Box::new(arrow_obj_pattern(sym.to_string())),
                    }],
                    type_args: None,
                }),
                _ => default_expr,
            })),
            is_async: false,
            is_generator: false,
            type_params: None,
            return_type: None,
        })
    }
}

impl Fold for FetchMacro {
    // Implement necessary fold_* methods for actual custom transform.
    // A comprehensive list of possible fold methods can be found here:
    // https://rustdoc.swc.rs/swc_ecma_visit/trait.Fold.html
    fn fold_import_decl(&mut self, id: ImportDecl) -> ImportDecl {
        let mut id = id.fold_children_with(self);

        let _ = id.specifiers.iter_mut().for_each(|i| {
            match (id.src.value.to_string().eq("fetch.macro"), i) {
                (true, ImportSpecifier::Default(sp)) => {
                    self.import_specifier = sp.local.sym.to_string()
                }
                _ => {}
            }
        });

        id
    }

    fn fold_expr(&mut self, expr: Expr) -> Expr {
        let expr = expr.fold_children_with(self);

        match &expr {
            Expr::TaggedTpl(TaggedTpl { tag, tpl, .. }) => match &**tag {
                Expr::Ident(Ident { sym, .. }) => {
                    if sym.to_string().eq(&self.import_specifier.to_string()) {
                        self.replace_with_fetch_function(
                            args_of_fetch(ExprOrSpread {
                                spread: None,
                                expr: Box::new(Expr::Tpl(tpl.to_owned())),
                            }),
                            None,
                        )
                    } else {
                        expr
                    }
                }
                Expr::Member(member_expr) => match &*member_expr.obj {
                    Expr::Ident(Ident { sym, .. }) => {
                        if sym.to_string().eq(&self.import_specifier.to_string()) {
                            self.replace_with_fetch_function(
                                args_of_fetch(ExprOrSpread {
                                    spread: None,
                                    expr: Box::new(Expr::Tpl(tpl.to_owned())),
                                }),
                                Some(member_expr.to_owned()),
                            )
                        } else {
                            expr
                        }
                    }
                    _ => expr,
                },
                _ => expr,
            },
            _ => expr,
        }
    }

    // remove import source fetch.macro
    fn fold_module_items(&mut self, ims: Vec<ModuleItem>) -> Vec<ModuleItem> {
        let mut ims = ims.fold_children_with(self);

        ims.retain(|m| match &m {
            ModuleItem::ModuleDecl(ModuleDecl::Import(ImportDecl { src, .. })) => {
                !src.value.to_string().eq(&"fetch.macro".to_string())
            }
            _ => true,
        });

        ims.to_vec()
    }
}

/// An example plugin function with macro support.
/// `plugin_transform` macro interop pointers into deserialized structs, as well
/// as returning ptr back to host.
///
/// It is possible to opt out from macro by writing transform fn manually
/// if plugin need to handle low-level ptr directly via
/// `__transform_plugin_process_impl(
///     ast_ptr: *const u8, ast_ptr_len: i32,
///     unresolved_mark: u32, should_enable_comments_proxy: i32) ->
///     i32 /*  0 for success, fail otherwise.
///             Note this is only for internal pointer interop result,
///             not actual transform result */`
///
/// This requires manual handling of serialization / deserialization from ptrs.
/// Refer swc_plugin_macro to see how does it work internally.
#[plugin_transform]
pub fn process_transform(program: Program, _metadata: TransformPluginProgramMetadata) -> Program {
    program.fold_with(&mut FetchMacro::new())
}

// An example to test plugin transform.
// Recommended strategy to test plugin's transform is verify
// the Visitor's behavior, instead of trying to run `process_transform` with mocks
// unless explicitly required to do so.
test!(
    Default::default(),
    |_| FetchMacro::new(),
    basic,
    // Input codes
    r#"import f from "fetch.macro"; 
const fetcher = f`/api/v1/ping`;"#,
    // Output codes after transformed with plugin
    r#"const fetcher = (opts) => fetch(`/api/v1/ping`, opts);"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    import_with_name_fetch,
    // Input codes
    r#"import fetch from "fetch.macro"; 
const fetcher = fetch`/api/v1/ping`;"#,
    // Output codes after transformed with plugin
    r#"const fetcher = (opts) => fetch(`/api/v1/ping`, opts);"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    with_var,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts);"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    fetch_json,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f.json`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts).then(({json}) => json());"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    fetch_text,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f.text`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts).then(({text}) => text());"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    fetch_blob,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f.blob`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts).then(({blob}) => blob());"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    fetch_form_data,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f.formData`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts).then(({formData}) => formData());"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    fetch_array_buffer,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f.arrayBuffer`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts).then(({arrayBuffer}) => arrayBuffer());"#
);

test!(
    Default::default(),
    |_| FetchMacro::new(),
    fetch_clone,
    // Input codes
    r#"import f from "fetch.macro"; 
const urlVar = "/api/v1/ping";
const fetcher = f.clone`${urlVar}`;"#,
    // Output codes after transformed with plugin
    r#"
const urlVar = "/api/v1/ping";
const fetcher = (opts) => fetch(`${urlVar}`, opts).then(({clone}) => clone());"#
);
